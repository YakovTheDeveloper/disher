import { db, SYNCED_TABLES } from './schema';

// Auto-stamp every mutation with sync metadata so call-sites stay terse:
//   db.products.add({ id, user_id, name, ... })
// becomes the equivalent of writing:
//   db.products.add({ ..., _dirty: 1, edit_count: 0, client_modified_at: now() })
//
// Server-snapshot apply (snapshot pull, individual server ACK fields) goes
// through bulkPut with a sentinel `__server_apply` so the hook sees rows
// arriving from the server and skips bumping. The sentinel is stripped
// before the row is persisted.

const SENTINEL = '__server_apply' as const;

export type ServerApplyRow<T> = T & { [SENTINEL]?: true };

function nowIso(): string {
  return new Date().toISOString();
}

function isServerApply(obj: unknown): boolean {
  return Boolean(obj && typeof obj === 'object' && SENTINEL in obj);
}

function stripSentinel<T extends object>(obj: T): T {
  // Mutate in place — Dexie hooks are allowed to do this.
  if (SENTINEL in obj) delete (obj as Record<string, unknown>)[SENTINEL];
  return obj;
}

export function installDexieHooks(): void {
  for (const table of SYNCED_TABLES) {
    const t = db[table];

    // creating: fires before .add() / .put() inserts a NEW row.
    t.hook('creating', (_pk, obj) => {
      if (isServerApply(obj)) {
        stripSentinel(obj as object);
        // Server-applied rows: trust their fields verbatim, _dirty=0.
        const o = obj as unknown as Record<string, unknown>;
        if (o._dirty == null) o._dirty = 0;
        if (o.created_at == null) o.created_at = nowIso();
        return;
      }
      const o = obj as unknown as Record<string, unknown>;
      o._dirty = 1;
      if (typeof o.edit_count !== 'number') o.edit_count = 0;
      o.client_modified_at = nowIso();
      if (o.created_at == null) o.created_at = nowIso();
      if (!('deleted_at' in o)) o.deleted_at = null;
    });

    // updating: fires before .update() / .put() modifies an existing row.
    // Returning an object merges those keys into the modifications.
    t.hook('updating', (modifications, _pk, _existing) => {
      if (isServerApply(modifications)) {
        stripSentinel(modifications as object);
        // Server-applied update: keep _dirty=0 unless caller explicitly set it.
        const m = modifications as Record<string, unknown>;
        return { ...m };
      }
      const m = modifications as Record<string, unknown>;
      const existing = _existing as { edit_count?: number };
      const next: Record<string, unknown> = {
        ...m,
        _dirty: 1,
        edit_count: (existing?.edit_count ?? 0) + 1,
        client_modified_at: nowIso(),
      };
      return next;
    });

    // We don't use `deleting` — soft-delete is an UPDATE setting deleted_at.
  }
}

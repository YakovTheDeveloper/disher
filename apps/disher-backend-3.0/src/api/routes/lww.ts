// Pure LWW decision used by /api/backup. Mirrors the SQL WHERE clause
// inside applyBackupBatch in backup.ts so we can property-test it without
// hitting the DB. If you change one, change the other.
//
// Decision rules (per backup-polling-implementation-guide §4.2):
//   1. If no server row exists → accept (INSERT).
//   2. Soft-delete sticky: if incoming.deleted_at is set and server.deleted_at
//      is null → accept (we let deletes win once).
//   3. If either side is already deleted (server.deleted_at non-null) →
//      reject (sticky tombstone — stale insert/update never resurrects).
//   4. Otherwise primary by edit_count: incoming > server → accept.
//   5. Tie on edit_count: incoming.client_modified_at >= server.client_modified_at
//      → accept (>= so re-sending the same row is an idempotent no-op).
//   6. Else reject.

export type LwwState = {
  edit_count: number;
  /** ISO string. */
  client_modified_at: string;
  /** ISO string or null. */
  deleted_at: string | null;
};

export type LwwDecision = "accept" | "reject";

export function decideLww(
  server: LwwState | null,
  incoming: LwwState,
): LwwDecision {
  if (!server) return "accept";
  if (server.deleted_at == null && incoming.deleted_at != null) return "accept";
  if (server.deleted_at != null) return "reject";
  if (incoming.deleted_at != null) {
    // server.deleted_at is null, handled above.
    return "accept";
  }
  if (incoming.edit_count > server.edit_count) return "accept";
  if (incoming.edit_count < server.edit_count) return "reject";
  // Tie: tie-break by client_modified_at (>= so identical rows are accepted).
  return incoming.client_modified_at >= server.client_modified_at
    ? "accept"
    : "reject";
}

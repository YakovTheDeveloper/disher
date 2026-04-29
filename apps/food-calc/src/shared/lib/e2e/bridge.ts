/**
 * E2E test bridge — exposed on window only when MODE === 'test'.
 * Lets Playwright drive Dexie / sync / auth state without touching real UI.
 * Tree-shaken out in production builds.
 */
import { clear as idbClear, keys as idbKeysFn } from 'idb-keyval';
import { supabase } from '@/shared/api/supabase-client';
import { queryClient } from '@/shared/lib/storage/queryClient';
import { db, SYNCED_TABLES } from '@/shared/lib/dexie/schema';
import { drainPush, pullSnapshot } from '@/shared/lib/sync/backupClient';

export function installE2EBridge(): void {
  if (import.meta.env.MODE !== 'test') return;
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>).__e2e = {
    // Dexie state inspection.
    countLocal: async () => {
      const out: Record<string, number> = {};
      for (const t of SYNCED_TABLES) out[t] = await db[t].count();
      return out;
    },
    countDirty: async (userId: string) => {
      const out: Record<string, number> = {};
      for (const t of SYNCED_TABLES) {
        out[t] = await db[t]
          .where('[user_id+_dirty]')
          .equals([userId, 1] as never)
          .count();
      }
      return out;
    },
    wipeLocal: async () => {
      await db.transaction('rw', SYNCED_TABLES.map((t) => db[t]), async () => {
        for (const t of SYNCED_TABLES) await db[t].clear();
      });
    },

    // Sync triggers.
    drainPush,
    pullSnapshot,

    // idb-keyval for drafts / persister.
    clearIdb: () => idbClear(),
    idbKeys: () => idbKeysFn().then((arr) => arr.map((k) => String(k))),

    // TanStack Query (legacy cache may still be in flight during transition).
    invalidateAllQueries: () => queryClient.invalidateQueries(),
    queryCacheKeys: () =>
      queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.queryKey),

    // Auth.
    getSession: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}

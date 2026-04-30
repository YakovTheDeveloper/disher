/**
 * E2E test bridge — exposed on window only when MODE === 'test'.
 * Lets Playwright drive Dexie / sync / auth state without touching real UI.
 * Tree-shaken out in production builds.
 */
import { clear as idbClear, keys as idbKeysFn } from 'idb-keyval';
import { authClient } from '@/shared/lib/auth/authClient';
import { db, SYNCED_TABLES } from '@/shared/lib/dexie/schema';
import { drainPush, pullSnapshot } from '@/shared/lib/sync/backupClient';
import { areDexieHooksInstalled } from '@/shared/lib/dexie/hooks';
import { createProduct } from '@/entities/product/api/mutations';
import { createDish } from '@/entities/dish/api/mutations';
import { addScheduleFood } from '@/entities/schedule-food/api/mutations';

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
    hooksInstalled: () => areDexieHooksInstalled(),

    // Entity mutations — proxy real entity api so E2E exercises the same code as UI.
    createProduct,
    createDish,
    addScheduleFood,

    // idb-keyval for drafts.
    clearIdb: () => idbClear(),
    idbKeys: () => idbKeysFn().then((arr) => arr.map((k) => String(k))),

    // Auth.
    getSession: async () => {
      const { data } = await authClient.getSession();
      return data.session;
    },
    signInTest: async (email = 'e2e@disher.test', password = 'e2e-password') => {
      const { data, error } = await authClient.signInWithPassword(email, password);
      if (error) throw error;
      return data.session;
    },
    signOut: async () => {
      await authClient.signOut();
    },
  };
}

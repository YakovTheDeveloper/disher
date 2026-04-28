/**
 * E2E test bridge — exposed on window only when MODE === 'test'.
 * Lets Playwright drive the outbox / cache / auth state without touching real UI.
 * Tree-shaken out in production builds.
 */
import { get, clear as idbClear, keys as idbKeysFn } from 'idb-keyval';
import { supabase } from '@/shared/api/supabase-client';
import { queryClient } from '@/shared/lib/storage/queryClient';
import {
  enqueue,
  drain,
  getPendingCount,
  primePendingCache,
  clearPending,
  type PendingWrite,
} from '@/shared/lib/storage/pendingWrites';

const KEY = 'foodcalc-pending-writes';

export function installE2EBridge(): void {
  if (import.meta.env.MODE !== 'test') return;
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>).__e2e = {
    enqueue,
    drain,
    getPendingCount,
    primePendingCache,
    clearPending,
    readIdbPending: () => get<PendingWrite[]>(KEY),
    clearIdb: () => idbClear(),
    idbKeys: () => idbKeysFn().then((arr) => arr.map((k) => String(k))),
    invalidateAllQueries: () => queryClient.invalidateQueries(),
    queryCacheKeys: () =>
      queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.queryKey),
    getSession: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}

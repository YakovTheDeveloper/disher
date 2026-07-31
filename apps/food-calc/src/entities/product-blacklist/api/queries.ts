import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import type { BlacklistedProduct } from '../model/types';

// The set of product ids the suggest feature must never offer. Returns an
// empty Set while useLiveQuery is on its first tick (rows arrive undefined).
export function useBlacklistedProductIds(): Set<string> {
  const rows = useLiveQuery(() => db.product_blacklist.toArray(), []);
  return useMemo(() => new Set((rows ?? []).map((r) => r.product_id)), [rows]);
}

// True on the first useLiveQuery tick (rows still undefined) — orchestrators
// that must not compute on a half-loaded blacklist gate on this.
export function useBlacklistLoading(): boolean {
  return useLiveQuery(() => db.product_blacklist.toArray(), []) === undefined;
}

// Full rows (row id + product_id) for the management screen in the profile:
// removal goes by product_id (ALL duplicates are un-banned together — they can
// converge from two devices, see mutations.removeFromBlacklist), the product
// name is resolved by the caller via entities/product (cross-entity glue stays
// feature-side). Empty array on the first useLiveQuery tick.
export function useBlacklistedProducts(): BlacklistedProduct[] {
  const rows = useLiveQuery(() => db.product_blacklist.toArray(), []);
  return useMemo(
    () =>
      (rows ?? []).map((r) => ({
        id: r.id,
        productId: r.product_id,
        createdAt: r.created_at,
      })),
    [rows],
  );
}

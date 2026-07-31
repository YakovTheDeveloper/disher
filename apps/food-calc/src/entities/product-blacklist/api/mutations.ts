import { db } from '@/shared/lib/dexie/schema';
import { putRow, deleteRows } from '@/shared/lib/dexie/write';

/**
 * Ban a product from the «Что доесть?» suggestions. Idempotent: an existing
 * row for this product_id is left alone, so repeats don't pile up duplicates
 * (same convergence contract as upsertCustomTags — LWW by primary key cannot
 * dedupe a natural key across devices, see INVARIANTS И-12). Check-then-put
 * runs in one rw-tx so two rapid taps can't race a duplicate in.
 */
export async function addToBlacklist(productId: string): Promise<void> {
  if (!productId) return;
  await db.transaction('rw', db.product_blacklist, async () => {
    const existing = await db.product_blacklist
      .where('product_id')
      .equals(productId)
      .first();
    if (existing) return;
    await putRow(db.product_blacklist, {
      id: crypto.randomUUID(),
      product_id: productId,
      created_at: new Date().toISOString(),
    });
  });
}

/**
 * Un-ban a product: removes EVERY row with this product_id, not just one.
 * Duplicates can't be created locally (addToBlacklist is idempotent) but can
 * converge from two devices banning offline at once (natural-key merge, И-12)
 * — un-banning only one of them would leave the product hidden. deleteRows
 * writes all tombstones in one rw-tx, so the un-ban propagates to the fleet.
 */
export async function removeFromBlacklist(productId: string): Promise<void> {
  if (!productId) return;
  const rows = await db.product_blacklist
    .where('product_id')
    .equals(productId)
    .toArray();
  await deleteRows(rows.map((r) => ({ table: db.product_blacklist, id: r.id })));
}

import { db, type CustomTagRow } from '@/shared/lib/dexie/schema';
import { normalizeTag } from '@/shared/lib/details/tags';

/**
 * Upsert a batch of tags for one productId. Tags are normalised here;
 * existing (product_id, tag) pairs are skipped so the table converges to a
 * unique set even if the same tag is sent again.
 */
export async function upsertCustomTags(
  productId: string,
  tags: readonly string[],
): Promise<void> {
  if (!productId) return;
  const normalised = Array.from(
    new Set(tags.map((t) => normalizeTag(t)).filter(Boolean)),
  );
  if (normalised.length === 0) return;

  const existing = await db.custom_tags
    .where('product_id')
    .equals(productId)
    .toArray();
  const existingSet = new Set(existing.map((r) => r.tag));

  const toAdd: CustomTagRow[] = [];
  const now = new Date().toISOString();
  for (const tag of normalised) {
    if (existingSet.has(tag)) continue;
    toAdd.push({
      id: crypto.randomUUID(),
      product_id: productId,
      tag,
      created_at: now,
    });
  }
  if (toAdd.length === 0) return;
  await db.custom_tags.bulkAdd(toAdd);
}

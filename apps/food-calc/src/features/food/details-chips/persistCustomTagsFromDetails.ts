import { db } from '@/shared/lib/dexie/schema';
import { findCatalogProduct } from '@/shared/data/catalog';
import { upsertCustomTags } from '@/entities/custom-tag';
import { getSuggestionsForProduct } from '@/shared/data/tag-suggestions';
import { extractCustomTokens, normalizeTag } from '@/shared/lib/details/tags';

// Walks the `details` of a just-committed schedule_food and stashes any
// tokens that aren't in the curated TAG_SUGGESTIONS for the product's
// categories. Idempotent — `upsertCustomTags` skips existing pairs.
//
// Best-effort: invoked fire-and-forget from useScheduleFoodFlow after a
// successful add/update. Failure here must not break the schedule write.
export async function persistCustomTagsFromDetails(
  productId: string | null | undefined,
  details: string | null | undefined,
): Promise<void> {
  if (!productId) return;
  const text = (details ?? '').trim();
  if (!text) return;

  const categories = await readCategories(productId);

  // Build the "known" set across the merged suggestions for these categories.
  // Tags that exist in TAG_SUGGESTIONS *somewhere* (other categories) but
  // not in *this* product's categories still count as custom for this
  // product — that's intentional, custom_tags is per-product.
  const known = new Set(
    getSuggestionsForProduct(categories).map((t) => normalizeTag(t)),
  );
  const customs = extractCustomTokens(text, known);
  if (customs.length === 0) return;
  await upsertCustomTags(productId, customs);
}

async function readCategories(productId: string): Promise<string[]> {
  const catalogHit = findCatalogProduct(productId);
  if (catalogHit) {
    return Array.isArray(catalogHit.categories)
      ? (catalogHit.categories as string[])
      : [];
  }
  const row = await db.products.get(productId);
  if (!row) return [];
  if (Array.isArray(row.categories)) return row.categories as string[];
  return [];
}

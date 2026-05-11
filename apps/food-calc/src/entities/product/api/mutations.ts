import { db, type ProductRow } from '@/shared/lib/dexie/schema';

function safeParseJson<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export async function createProduct(params: {
  name: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const row: ProductRow = {
    id,
    name: params.name,
    source: '',
    nutrients: {},
    portions: [],
    categories: [],
    serving_basis: '100g',
    serving_unit: null,
    created_at: new Date().toISOString(),
  };
  await db.products.add(row);
  return id;
}

type ProductUpdates = Partial<{
  name: string;
  source: string;
  /** UI passes JSON string; we store the parsed object in Dexie. */
  nutrients: string;
  portions: string;
  categories: string;
  servingBasis: '100g' | 'serving';
  servingUnit: 'IU' | 'mg' | 'mcg' | 'g' | 'шт' | null;
}>;

const COLUMN_MAP: Record<keyof ProductUpdates, string> = {
  name: 'name',
  source: 'source',
  nutrients: 'nutrients',
  portions: 'portions',
  categories: 'categories',
  servingBasis: 'serving_basis',
  servingUnit: 'serving_unit',
};

const JSON_FIELDS: ReadonlySet<keyof ProductUpdates> = new Set([
  'nutrients',
  'portions',
  'categories',
]);

export async function updateProduct(
  productId: string,
  updates: ProductUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof ProductUpdates)[];
  if (keys.length === 0) return;

  const patch: Record<string, unknown> = {};
  for (const key of keys) {
    const col = COLUMN_MAP[key];
    if (JSON_FIELDS.has(key)) {
      patch[col] = safeParseJson<unknown>(
        updates[key] as string,
        key === 'nutrients' ? {} : [],
      );
    } else {
      patch[col] = updates[key];
    }
  }

  await db.products.update(productId, patch as never);
}

export async function setProductNutrients(
  productId: string,
  nutrients: string,
): Promise<void> {
  await updateProduct(productId, { nutrients });
}

export async function setProductPortions(
  productId: string,
  portions: string,
): Promise<void> {
  await updateProduct(productId, { portions });
}

export async function deleteProduct(productId: string): Promise<void> {
  await db.products.delete(productId);
}

export async function deleteProducts(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;
  await db.products.bulkDelete(productIds);
}

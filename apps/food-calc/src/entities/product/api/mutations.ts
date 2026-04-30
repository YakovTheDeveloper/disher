import { db, type ProductRow } from '@/shared/lib/dexie/schema';
import { getUserIdSync } from '@/shared/lib/auth/useUserId';
import { scheduleCold } from '@/shared/lib/sync/scheduler';

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

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
  nameEng?: string;
  description?: string;
  descriptionEng?: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();

  // Hooks auto-stamp _dirty/edit_count/client_modified_at/created_at/deleted_at.
  await db.products.add({
    id,
    user_id: userId,
    name: params.name,
    name_eng: params.nameEng ?? '',
    description: params.description ?? '',
    description_eng: params.descriptionEng ?? '',
    source: '',
    price_per_kg: 0,
    nutrients: {},
    portions: [],
    categories: [],
  } as unknown as ProductRow);

  scheduleCold();
  return id;
}

type ProductUpdates = Partial<{
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  source: string;
  pricePerKg: number;
  /** UI passes JSON string; we store the parsed object in Dexie. */
  nutrients: string;
  portions: string;
  categories: string;
}>;

const COLUMN_MAP: Record<keyof ProductUpdates, string> = {
  name: 'name',
  nameEng: 'name_eng',
  description: 'description',
  descriptionEng: 'description_eng',
  source: 'source',
  pricePerKg: 'price_per_kg',
  nutrients: 'nutrients',
  portions: 'portions',
  categories: 'categories',
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
  scheduleCold();
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
  await db.products.update(productId, {
    deleted_at: new Date().toISOString(),
  });
  scheduleCold();
}

export async function deleteProducts(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;
  const now = new Date().toISOString();
  await db.transaction('rw', db.products, async () => {
    for (const id of productIds) {
      await db.products.update(id, { deleted_at: now });
    }
  });
  scheduleCold();
}

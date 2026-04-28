import { enqueue, enqueueMany, drain } from "@/shared/lib/storage/pendingWrites";
import { queryClient } from "@/shared/lib/storage/queryClient";
import { getUserIdSync } from "@/shared/lib/auth/useUserId";
import type { Product } from "../model/types";

const TABLE = "products";

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error("Not authenticated");
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

function patchProductsCache(
  predicate: (p: Product) => boolean,
  patch: (p: Product) => Product,
) {
  queryClient.setQueriesData<Product[]>({ queryKey: ["products", "all"] }, (old) => {
    if (!old) return old;
    return old.map((p) => (predicate(p) ? patch(p) : p));
  });
}

export async function createProduct(params: {
  name: string;
  nameEng?: string;
  description?: string;
  descriptionEng?: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  const now = new Date().toISOString();
  const row = {
    id,
    user_id: userId,
    name: params.name,
    name_eng: params.nameEng ?? "",
    description: params.description ?? "",
    description_eng: params.descriptionEng ?? "",
    source: "",
    price_per_kg: 0,
    nutrients: {},
    portions: [],
    categories: [],
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  // Optimistic add to all "products/all/*" caches.
  const optimistic: Product = {
    id,
    userId,
    name: params.name,
    nameEng: params.nameEng ?? "",
    description: params.description ?? "",
    descriptionEng: params.descriptionEng ?? "",
    source: "",
    pricePerKg: 0,
    nutrients: "{}",
    portions: "[]",
    categories: "[]",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  queryClient.setQueriesData<Product[]>(
    { queryKey: ["products", "all"] },
    (old) => (old ? [...old, optimistic] : old),
  );

  await enqueue({ table: TABLE, op: "insert", payload: row });
  void drain();
  return id;
}

type ProductUpdates = Partial<{
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  source: string;
  pricePerKg: number;
  nutrients: string;
  portions: string;
  categories: string;
}>;

const COLUMN_MAP: Record<keyof ProductUpdates, string> = {
  name: "name",
  nameEng: "name_eng",
  description: "description",
  descriptionEng: "description_eng",
  source: "source",
  pricePerKg: "price_per_kg",
  nutrients: "nutrients",
  portions: "portions",
  categories: "categories",
};

const JSON_FIELDS: ReadonlySet<keyof ProductUpdates> = new Set([
  "nutrients",
  "portions",
  "categories",
]);

function buildUpdatePayload(productId: string, updates: ProductUpdates) {
  const payload: Record<string, unknown> = {
    id: productId,
    updated_at: new Date().toISOString(),
  };
  for (const key of Object.keys(updates) as (keyof ProductUpdates)[]) {
    const col = COLUMN_MAP[key];
    const raw = updates[key];
    if (JSON_FIELDS.has(key)) {
      payload[col] = safeParseJson<unknown>(raw as string, key === "nutrients" ? {} : []);
    } else {
      payload[col] = raw;
    }
  }
  return payload;
}

export async function updateProduct(
  productId: string,
  updates: ProductUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof ProductUpdates)[];
  if (keys.length === 0) return;

  // Optimistic patch in cache.
  patchProductsCache(
    (p) => p.id === productId,
    (p) => {
      const next: Product = { ...p };
      for (const k of keys) {
        // Cache stores stringified jsonb (matches queryFn normalization).
        (next as unknown as Record<string, unknown>)[k] = updates[k];
      }
      next.updatedAt = new Date().toISOString();
      return next;
    },
  );

  const payload = buildUpdatePayload(productId, updates);
  await enqueue({ table: TABLE, op: "upsert", payload });
  void drain();
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
  // Optimistic removal. We don't invalidateQueries here — the refetch would
  // race the outbox drain and bring the row back for ~1s on slow networks
  // (план: «Delete + invalidate race»). The outbox poison-handler will
  // invalidate if the delete fails to land.
  queryClient.setQueriesData<Product[]>(
    { queryKey: ["products", "all"] },
    (old) => (old ? old.filter((p) => p.id !== productId) : old),
  );
  await enqueue({ table: TABLE, op: "delete", payload: { id: productId } });
  void drain();
}

export async function deleteProducts(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;
  const idSet = new Set(productIds);
  queryClient.setQueriesData<Product[]>(
    { queryKey: ["products", "all"] },
    (old) => (old ? old.filter((p) => !idSet.has(p.id)) : old),
  );
  await enqueueMany(
    productIds.map((id) => ({ table: TABLE, op: "delete" as const, payload: { id } })),
  );
  void drain();
}

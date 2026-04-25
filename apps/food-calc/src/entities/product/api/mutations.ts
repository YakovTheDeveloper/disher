import { db } from "@/powersync/database";
import { supabase } from "@/powersync/supabase-client";

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function createProduct(params: {
  name: string;
  nameEng?: string;
  description?: string;
  descriptionEng?: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = await currentUserId();
  await db.execute(
    `insert into products
      (id, user_id, name, name_eng, description, description_eng,
       source, price_per_kg, nutrients, portions, categories)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      params.name,
      params.nameEng ?? "",
      params.description ?? "",
      params.descriptionEng ?? "",
      "",
      0,
      "{}",
      "[]",
      "[]",
    ],
  );
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

export async function updateProduct(productId: string, updates: ProductUpdates): Promise<void> {
  const keys = Object.keys(updates) as (keyof ProductUpdates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${COLUMN_MAP[k]} = ?`).join(", ");
  const values = keys.map((k) => updates[k] as unknown);
  await db.execute(
    `update products set ${setClauses} where id = ?`,
    [...values, productId],
  );
}

export async function setProductNutrients(productId: string, nutrients: string): Promise<void> {
  await db.execute(`update products set nutrients = ? where id = ?`, [nutrients, productId]);
}

export async function setProductPortions(productId: string, portions: string): Promise<void> {
  await db.execute(`update products set portions = ? where id = ?`, [portions, productId]);
}

export async function deleteProduct(productId: string): Promise<void> {
  await db.execute(
    `update products set deleted_at = ? where id = ?`,
    [new Date().toISOString(), productId],
  );
}

export async function deleteProducts(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;
  const deletedAt = new Date().toISOString();
  const placeholders = productIds.map(() => "?").join(", ");
  await db.execute(
    `update products set deleted_at = ? where id in (${placeholders})`,
    [deletedAt, ...productIds],
  );
}

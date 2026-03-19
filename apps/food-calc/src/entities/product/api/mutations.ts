import { triplit } from "@/api/triplit/client";
import { getCurrentUserId } from "@/api/triplit/session";
import { v4 as uuid } from "uuid";

export async function createProduct(params: {
  name: string;
  nameEng?: string;
  description?: string;
  descriptionEng?: string;
}) {
  const id = uuid();
  await triplit.insert("foods", {
    id,
    userId: getCurrentUserId(),
    name: params.name,
    nameEng: params.nameEng ?? "",
    description: params.description ?? null,
    descriptionEng: params.descriptionEng ?? null,
  });
  return id;
}

export async function updateProduct(
  productId: string,
  updates: Partial<{ name: string; description: string; pricePerKg: number | null }>,
) {
  await triplit.update("foods", productId, (food) => {
    if (updates.name !== undefined) food.name = updates.name;
    if (updates.description !== undefined) food.description = updates.description;
    if (updates.pricePerKg !== undefined) food.pricePerKg = updates.pricePerKg;
  });
}

export async function setProductNutrient(
  productId: string,
  nutrientId: string,
  quantity: number,
) {
  const existing = await triplit.fetch(
    triplit
      .query("foodNutrients")
      .Where("foodId", "=", productId)
      .Where("nutrientId", "=", nutrientId),
  );
  const existingEntry = Array.from(existing.values())[0];

  if (existingEntry) {
    await triplit.update("foodNutrients", existingEntry.id, (fn) => {
      fn.quantity = quantity;
    });
  } else {
    await triplit.insert("foodNutrients", {
      id: uuid(),
      foodId: productId,
      nutrientId,
      quantity,
    });
  }
}

export async function addProductPortion(
  foodId: string,
  portion: { label: string; amount: number; unit: string; grams: number },
) {
  await triplit.insert("foodPortions", {
    id: uuid(),
    foodId,
    userId: getCurrentUserId(),
    label: portion.label,
    amount: portion.amount,
    unit: portion.unit,
    grams: portion.grams,
  });
}

export async function updateProductPortion(
  portionId: string,
  updates: Partial<{ label: string; amount: number; unit: string; grams: number }>,
) {
  await triplit.update("foodPortions", portionId, (p) => {
    if (updates.label !== undefined) p.label = updates.label;
    if (updates.amount !== undefined) p.amount = updates.amount;
    if (updates.unit !== undefined) p.unit = updates.unit;
    if (updates.grams !== undefined) p.grams = updates.grams;
  });
}

export async function removeProductPortion(portionId: string) {
  await triplit.delete("foodPortions", portionId);
}

export async function deleteProduct(productId: string) {
  const nutrients = await triplit.fetch(
    triplit.query("foodNutrients").Where("foodId", "=", productId),
  );
  const portions = await triplit.fetch(
    triplit.query("foodPortions").Where("foodId", "=", productId),
  );
  await Promise.all([
    ...(Array.from(nutrients.keys()) as unknown as string[]).map((id) => triplit.delete("foodNutrients", id)),
    ...(Array.from(portions.keys()) as unknown as string[]).map((id) => triplit.delete("foodPortions", id)),
  ]);
  await triplit.delete("foods", productId);
}

export async function deleteProducts(productIds: string[]) {
  await Promise.all(productIds.map(deleteProduct));
}

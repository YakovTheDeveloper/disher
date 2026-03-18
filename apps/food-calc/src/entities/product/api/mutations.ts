import { triplit } from "@/api/triplit/client";
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
    name: params.name,
    nameEng: params.nameEng ?? "",
    description: params.description ?? null,
    descriptionEng: params.descriptionEng ?? null,
  });
  return id;
}

export async function updateProduct(
  productId: string,
  updates: Partial<{ name: string; description: string }>,
) {
  await triplit.update("foods", productId, (food) => {
    if (updates.name !== undefined) food.name = updates.name;
    if (updates.description !== undefined) food.description = updates.description;
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

export async function deleteProduct(productId: string) {
  const nutrients = await triplit.fetch(
    triplit.query("foodNutrients").Where("foodId", "=", productId),
  );
  await Promise.all(
    Array.from(nutrients.keys()).map((id) => triplit.delete("foodNutrients", id)),
  );
  await triplit.delete("foods", productId);
}

export async function deleteProducts(productIds: string[]) {
  await Promise.all(productIds.map(deleteProduct));
}

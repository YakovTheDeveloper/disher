import { getCurrentUserId } from "@/shared/lib/user";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";

export function createProduct(
  store: Store,
  params: {
    name: string;
    nameEng?: string;
    description?: string;
    descriptionEng?: string;
  },
) {
  const id = crypto.randomUUID();
  store.commit(
    events.productCreated({
      id,
      userId: getCurrentUserId(),
      name: params.name,
      nameEng: params.nameEng ?? "",
      description: params.description ?? "",
      descriptionEng: params.descriptionEng ?? "",
      source: "",
      pricePerKg: 0,
      nutrients: "{}",
      portions: "[]",
      categories: "[]",
    }),
  );
  return id;
}

export function updateProduct(
  store: Store,
  productId: string,
  updates: Partial<{ name: string; description: string; pricePerKg: number }>,
) {
  store.commit(events.productUpdated({ id: productId, ...updates }));
}

export function setProductNutrients(
  store: Store,
  productId: string,
  nutrients: string, // JSON: Record<nutrientId, quantity>
) {
  store.commit(events.productUpdated({ id: productId, nutrients }));
}

export function setProductPortions(
  store: Store,
  productId: string,
  portions: string, // JSON: Array<{label, amount, unit, grams}>
) {
  store.commit(events.productUpdated({ id: productId, portions }));
}

export function deleteProduct(store: Store, productId: string) {
  store.commit(events.productDeleted({ id: productId, deletedAt: Date.now() }));
}

export function deleteProducts(store: Store, productIds: string[]) {
  const deletedAt = Date.now();
  store.commit(...productIds.map((id) => events.productDeleted({ id, deletedAt })));
}

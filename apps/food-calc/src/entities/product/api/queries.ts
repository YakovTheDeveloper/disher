import { useQuery, useEntity } from "@triplit/react";
import { triplit } from "@/api/triplit/client";

export function useProduct(productId: string | undefined) {
  return useEntity(triplit, "foods", productId ?? "");
}

export function useProducts(search?: string, limit = 50) {
  const query = triplit.query("foods").Limit(limit);
  return useQuery(triplit, search ? query.Where("name", "like", `%${search}%`) : query);
}

export function useProductsByIds(productIds: string[]) {
  return useQuery(
    triplit,
    triplit
      .query("foods")
      .Where("id", "in", productIds.length > 0 ? productIds : ["__none__"])
      .Include("nutrients"),
  );
}

export function useProductNutrients(productId: string | undefined) {
  return useQuery(
    triplit,
    triplit
      .query("foodNutrients")
      .Where("foodId", "=", productId ?? "")
      .Include("nutrient"),
  );
}

export function useProductPortions(productId: string | undefined) {
  return useQuery(
    triplit,
    triplit
      .query("foodPortions")
      .Where("foodId", "=", productId ?? ""),
  );
}

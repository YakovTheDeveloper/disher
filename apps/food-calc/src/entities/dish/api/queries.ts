import { useQuery, useEntity } from "@triplit/react";
import { triplit } from "@/api/triplit/client";

export function useDishes(search?: string) {
  const query = triplit.query("dishes").Include("items");
  return useQuery(triplit, search ? query.Where("name", "like", `%${search}%`) : query);
}

export function useDish(dishId: string | undefined) {
  return useEntity(triplit, "dishes", dishId ?? "");
}

export function useDishItems(dishId: string | undefined) {
  return useQuery(
    triplit,
    triplit
      .query("dishItems")
      .Where("dishId", "=", dishId ?? "")
      .Include("food"),
  );
}

export function useDishPortions(dishId: string | undefined) {
  return useQuery(
    triplit,
    triplit
      .query("dishPortions")
      .Where("dishId", "=", dishId ?? ""),
  );
}

export function useDishItemsByDishIds(dishIds: string[]) {
  return useQuery(
    triplit,
    triplit
      .query("dishItems")
      .Where("dishId", "in", dishIds.length > 0 ? dishIds : ["__none__"]),
  );
}

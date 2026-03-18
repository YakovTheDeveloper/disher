import { useQuery, useEntity } from "@triplit/react";
import { triplit } from "@/api/triplit/client";

export function useDailyNorms() {
  return useQuery(triplit, triplit.query("dailyNorms").Include("items"));
}

export function useDailyNorm(normId: string | undefined) {
  return useEntity(triplit, "dailyNorms", normId ?? "");
}

export function useDailyNormItems(normId: string | undefined) {
  return useQuery(
    triplit,
    triplit
      .query("dailyNormItems")
      .Where("normId", "=", normId ?? "")
      .Include("nutrient"),
  );
}

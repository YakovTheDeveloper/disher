import { useQuery, useEntity } from "@triplit/react";
import { triplit } from "@/api/triplit/client";

export function useDailyNorms() {
  return useQuery(triplit, triplit.query("dailyNorms"));
}

export function useDailyNorm(normId: string | undefined) {
  return useEntity(triplit, "dailyNorms", normId ?? "");
}

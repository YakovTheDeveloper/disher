import { useQuery, useEntity } from "@triplit/react";
import { triplit } from "@/api/triplit/client";

export function useNutrients() {
  return useQuery(triplit, triplit.query("nutrients"));
}

export function useNutrient(nutrientId: string | undefined) {
  return useEntity(triplit, "nutrients", nutrientId ?? "");
}

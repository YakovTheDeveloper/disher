import { useQuery } from "@triplit/react";
import { triplit } from "@/api/triplit/client";

export function useScheduleFoods(date: string | undefined) {
  return useQuery(
    triplit,
    triplit
      .query("scheduleFoods")
      .Where("date", "=", date ?? "")
      .Include("food")
      .Include("dish"),
  );
}

export function useScheduleFoodsByDates(dates: string[]) {
  return useQuery(
    triplit,
    triplit.query("scheduleFoods").Where("date", "in", dates),
  );
}

export function useAllScheduleFoods() {
  return useQuery(
    triplit,
    triplit.query("scheduleFoods").Select(["date"]),
  );
}

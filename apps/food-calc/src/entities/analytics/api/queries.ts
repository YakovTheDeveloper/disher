import { API_BASE } from "@/shared/lib/api/base";
import { authHeaders } from "@/shared/lib/api/authHeaders";
import type { DailyAnalysisResponse, WeeklyAnalysisResponse } from "../model/types";

export class AnalyticsAuthError extends Error {
  constructor() {
    super("auth_required");
    this.name = "AnalyticsAuthError";
  }
}

// 404 → null (no cached analysis yet).
// 401 → throw AnalyticsAuthError (caller can trigger signOut / re-auth UI).
// network / other 5xx → null (treated as offline; UI falls back to local cache).
async function readCachedAnalysis<T>(url: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(url, { headers: await authHeaders() });
  } catch {
    return null;
  }
  if (res.status === 404) return null;
  if (res.status === 401) throw new AnalyticsAuthError();
  if (!res.ok) return null;
  return res.json();
}

export function fetchDailyAnalysis(
  date: string,
  tab: "food" | "day",
): Promise<DailyAnalysisResponse | null> {
  return readCachedAnalysis<DailyAnalysisResponse>(
    `${API_BASE}/api/analytics/v2/daily/${date}?tab=${tab}`,
  );
}

export function fetchWeeklyAnalysis(
  weekStart: string,
): Promise<WeeklyAnalysisResponse | null> {
  return readCachedAnalysis<WeeklyAnalysisResponse>(
    `${API_BASE}/api/analytics/v2/weekly/${weekStart}`,
  );
}

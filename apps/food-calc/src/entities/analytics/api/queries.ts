import { API_BASE } from "@/shared/lib/api/base";
import { authHeaders } from "@/shared/lib/api/authHeaders";
import type { DailyAnalysisResponse, WeeklyAnalysisResponse } from "../model/types";

export async function fetchDailyAnalysis(
  date: string,
  tab: "food" | "day"
): Promise<DailyAnalysisResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/analytics/v2/daily/${date}?tab=${tab}`,
      { headers: await authHeaders() }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchWeeklyAnalysis(
  weekStart: string
): Promise<WeeklyAnalysisResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/analytics/v2/weekly/${weekStart}`,
      { headers: await authHeaders() }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

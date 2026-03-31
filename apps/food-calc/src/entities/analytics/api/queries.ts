import { API_BASE } from "@/shared/lib/api/base";
import type { DailyAnalysisResponse, WeeklyAnalysisResponse } from "../model/types";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchDailyAnalysis(
  date: string,
  tab: "food" | "day"
): Promise<DailyAnalysisResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/analytics/daily/${date}?tab=${tab}`,
      { headers: getAuthHeaders() }
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
      `${API_BASE}/api/analytics/weekly/${weekStart}`,
      { headers: getAuthHeaders() }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

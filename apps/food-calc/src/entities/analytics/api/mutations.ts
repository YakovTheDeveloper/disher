import { API_BASE } from "@/shared/lib/api/base";
import { authHeaders } from "@/shared/lib/api/authHeaders";
import { AnalyticsAuthError } from "./queries";

interface FoodSnapshot {
  time: string;
  type: "food" | "dish";
  name: string;
  quantity: number;
  items?: Array<{ name: string; quantity: number }>;
}

interface EventSnapshot {
  time: string;
  text: string | null;
  atoms: unknown[];
}

type StartResult =
  | { cached: true; content: string }
  | { cached: false; response: Response };

async function handleStartResponse(
  res: Response,
  offlineLabel: string,
): Promise<StartResult> {
  if (res.status === 401) throw new AnalyticsAuthError();
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      res.status === 400
        ? offlineLabel
        : res.status >= 500
          ? "Сервер временно недоступен"
          : `Ошибка: ${res.status} ${text}`,
    );
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    return { cached: true, content: data.content };
  }
  return { cached: false, response: res };
}

/**
 * Start a daily analysis stream (POST /api/analytics/v2/daily/:date).
 * If the server has a cached result with matching inputHash, returns it without streaming.
 * Otherwise returns a Response for SSE streaming.
 */
export async function startDailyAnalysis(
  date: string,
  tab: "food" | "day",
  foods: FoodSnapshot[],
  events: EventSnapshot[],
  inputHash: string,
  signal?: AbortSignal,
): Promise<StartResult> {
  const body = { tab, foods, events: tab === "day" ? events : undefined, inputHash };

  const res = await fetch(`${API_BASE}/api/analytics/v2/daily/${date}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
    signal,
  });

  return handleStartResponse(res, "Некорректные данные");
}

/**
 * Start a weekly analysis stream (POST /api/analytics/v2/weekly/:weekStart).
 */
export async function startWeeklyAnalysis(
  weekStart: string,
  dates: string[],
  signal?: AbortSignal,
): Promise<StartResult> {
  const res = await fetch(`${API_BASE}/api/analytics/v2/weekly/${weekStart}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ dates }),
    signal,
  });

  return handleStartResponse(res, "Недостаточно данных для недельного анализа");
}

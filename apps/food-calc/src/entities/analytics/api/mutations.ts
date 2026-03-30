import { API_BASE } from "@/api/triplit/session";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("triplit_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface FoodSnapshot {
  time: string;
  type: "food" | "dish";
  name: string;
  quantity: number;
  items?: Array<{ name: string; quantity: number }>;
}

interface EventSnapshot {
  time: string;
  text: string;
  atoms: unknown[];
}

/**
 * Start a daily analysis stream (POST /api/analytics/daily/:date).
 * If the server has a cached result with matching inputHash, returns it without streaming.
 * Otherwise returns a Response for SSE streaming.
 */
export async function startDailyAnalysis(
  date: string,
  tab: "food" | "day",
  foods: FoodSnapshot[],
  events: EventSnapshot[],
  inputHash: string,
  signal?: AbortSignal
): Promise<{ cached: true; content: string } | { cached: false; response: Response }> {
  const body = { tab, foods, events: tab === "day" ? events : undefined, inputHash };

  const res = await fetch(`${API_BASE}/api/analytics/daily/${date}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      res.status === 400
        ? "Некорректные данные"
        : res.status >= 500
          ? "Сервер временно недоступен"
          : `Ошибка: ${res.status} ${text}`
    );
  }

  // If server returned JSON (cached result), parse it
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    return { cached: true, content: data.content };
  }

  // Otherwise it's an SSE stream
  return { cached: false, response: res };
}

/**
 * Start a weekly analysis stream (POST /api/analytics/weekly/:weekStart).
 */
export async function startWeeklyAnalysis(
  weekStart: string,
  dates: string[],
  signal?: AbortSignal
): Promise<{ cached: true; content: string } | { cached: false; response: Response }> {
  const res = await fetch(`${API_BASE}/api/analytics/weekly/${weekStart}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ dates }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      res.status === 400
        ? "Недостаточно данных для недельного анализа"
        : res.status >= 500
          ? "Сервер временно недоступен"
          : `Ошибка: ${res.status} ${text}`
    );
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    return { cached: true, content: data.content };
  }

  return { cached: false, response: res };
}

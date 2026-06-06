import { API_BASE } from '@/shared/lib/api/base';

export interface BugReportPayload {
  text: string;
  page: string;
  screenSize: string;
  userAgent: string;
  pwa: string;
  /** PNG dataURL, optional — capture is best-effort. */
  screenshot?: string;
}

export interface BugReportResult {
  ok: boolean;
  filename?: string;
}

// Unprotected dev endpoint — raw fetch, no bearer (mirrors parseDishName).
// Trailing slash matters: the route is registered at prefix /api/bug-reports
// with a "/" handler, so /api/bug-reports (no slash) 404s under Fastify's
// default ignoreTrailingSlash:false.
export async function submitBugReport(
  payload: BugReportPayload,
): Promise<BugReportResult> {
  const res = await fetch(`${API_BASE}/api/bug-reports/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.error === 'string') errorMsg = body.error;
    } catch {
      // keep HTTP code
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<BugReportResult>;
}

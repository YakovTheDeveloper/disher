import { API_BASE } from '@/shared/lib/api/base';

export interface BugReportListItem {
  filename: string;
  text: string;
  page: string | null;
  screenSize: string | null;
  userAgent: string;
  pwa: string | null;
  screenshotFile: string | null;
  createdAt: string;
}

// Dev endpoint — raw fetch, no bearer (mirrors submitBugReport). Trailing slash
// matters: the route is registered at /api/bug-reports with a "/" handler.
export async function listBugReports(): Promise<BugReportListItem[]> {
  const res = await fetch(`${API_BASE}/api/bug-reports/`, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as { reports?: BugReportListItem[] };
  return body.reports ?? [];
}

export async function deleteBugReport(filename: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/bug-reports/${encodeURIComponent(filename)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** URL the backend serves a report's screenshot bytes from. */
export function bugReportImageUrl(screenshotFile: string): string {
  return `${API_BASE}/api/bug-reports/image/${encodeURIComponent(screenshotFile)}`;
}

/** Read the work-status markdown board (backend-maintained, read-only here). */
export async function getBugReportStatus(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/bug-reports/status`, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as { md?: string };
  return body.md ?? '';
}

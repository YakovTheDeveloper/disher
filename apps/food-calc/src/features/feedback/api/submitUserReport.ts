import { API_BASE } from '@/shared/lib/api/base';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { getPwaTag } from '@/shared/lib/observability/pwaTag';

// Prod-safe user report: text + auto-collected client metadata → pg via the
// auth-gated /api/user-reports route. No screenshot — the trigger lives in the
// settings drawer, so a capture would just show the drawer, not the problem.
export async function submitUserReport(text: string): Promise<void> {
  const res = await authedFetch(`${API_BASE}/api/user-reports/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      text,
      page: window.location.pathname + window.location.search,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
      pwa: getPwaTag(),
    }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.error === 'string') msg = body.error;
    } catch {
      // keep HTTP code
    }
    throw new Error(msg);
  }
}

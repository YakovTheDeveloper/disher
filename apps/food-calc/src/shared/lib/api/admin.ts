// Admin API client — list users, top up a wallet, read a user's ledger, and a
// bare probe for env-admins. Same canon as billing.ts (authedFetch + API_BASE),
// errors go through throwApiError. NOTE: the admin routes reply with a FLAT
// `{ error }` body on 4xx (not the app-wide problem+json), which readApiError
// already understands (legacy `error` branch) — so throwApiError surfaces that
// string as the ApiResponseError message without any bespoke handling here.
//
// The client-side admin gate this powers is UX only; every route is guarded on
// the server (env-admin OR role='admin'). Money is integer kopecks.

import { authedFetch } from './authedFetch';
import { API_BASE } from './base';
import { throwApiError } from './apiError';

const ADMIN_BASE = `${API_BASE}/api/admin`;

export interface AdminUser {
  id: string;
  email: string | null;
  role: string | null;
  createdAt: string;
  balanceKop: number;
  hasWallet: boolean;
}

// Mirrors the backend LedgerRow. `meta` is included by the admin ledger route
// (unlike the self-serve /api/balance/ledger) so the top-up reason is visible.
export interface AdminLedgerRow {
  id: string;
  amountKop: number;
  balanceAfterKop: number;
  kind: string;
  feature: string | null;
  requestId: string | null;
  createdAt: string;
  meta: Record<string, unknown> | null;
}

export interface TopupInput {
  amountKop: number;
  reason: string;
  requestId: string;
}

export interface TopupResult {
  balanceKop: number;
  /** True when the same requestId was already applied — no second credit. */
  alreadyApplied: boolean;
}

export async function fetchAdminUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  const res = await authedFetch(`${ADMIN_BASE}/users`, { signal });
  if (!res.ok) await throwApiError(res);
  const data = (await res.json()) as { items?: AdminUser[] };
  return data.items ?? [];
}

export async function topupUser(
  userId: string,
  input: TopupInput,
  signal?: AbortSignal,
): Promise<TopupResult> {
  const res = await authedFetch(`${ADMIN_BASE}/users/${userId}/topup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok) await throwApiError(res);
  return res.json() as Promise<TopupResult>;
}

export async function fetchUserLedger(
  userId: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<AdminLedgerRow[]> {
  const res = await authedFetch(`${ADMIN_BASE}/users/${userId}/ledger?limit=${limit}`, {
    signal,
  });
  if (!res.ok) await throwApiError(res);
  const data = (await res.json()) as { items?: AdminLedgerRow[] };
  return data.items ?? [];
}

/**
 * One recorded login attempt (backend: auth/auth-events.ts). `outcome` is
 * 'success' (session issued), 'failure' (better-auth rejected it — bad password,
 * unverified email, an OAuth error code) or 'error' (an exception escaped: DB
 * down, Telegram unreachable, a bug). `email` is the ATTEMPTED identifier, so it
 * is present even when no such user exists — that's how you find who's stuck.
 */
export interface AuthEvent {
  id: string;
  createdAt: string;
  path: string | null;
  provider: string | null;
  outcome: 'success' | 'failure' | 'error';
  statusCode: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  userId: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
}

export interface AuthEventsQuery {
  /** Failures + errors only. The successes outnumber what we're hunting. */
  problemsOnly?: boolean;
  /** Substring match on email or user id. */
  q?: string;
  limit?: number;
}

export async function fetchAuthEvents(
  query: AuthEventsQuery = {},
  signal?: AbortSignal,
): Promise<AuthEvent[]> {
  const params = new URLSearchParams();
  if (query.problemsOnly) params.set('problems', '1');
  if (query.q?.trim()) params.set('q', query.q.trim());
  params.set('limit', String(query.limit ?? 100));

  const res = await authedFetch(`${ADMIN_BASE}/auth-events?${params.toString()}`, { signal });
  if (!res.ok) await throwApiError(res);
  const data = (await res.json()) as { items?: AuthEvent[] };
  return data.items ?? [];
}

/**
 * One user-submitted problem report («Сообщить о проблеме» → backend
 * routes/user-reports.ts). `email` is the reporter's, joined server-side — a
 * report you can't attribute is a report you can't answer.
 */
export interface UserReport {
  id: string;
  createdAt: string;
  text: string;
  page: string | null;
  screenSize: string | null;
  userAgent: string | null;
  pwa: string | null;
  userId: string;
  email: string | null;
}

export async function fetchUserReports(
  query: { q?: string; limit?: number } = {},
  signal?: AbortSignal,
): Promise<UserReport[]> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  params.set('limit', String(query.limit ?? 100));

  const res = await authedFetch(`${ADMIN_BASE}/user-reports?${params.toString()}`, {
    signal,
  });
  if (!res.ok) await throwApiError(res);
  const data = (await res.json()) as { items?: UserReport[] };
  return data.items ?? [];
}

/**
 * Result of the `GET /api/admin/me` probe used to recognize an env-admin whose
 * DB role is still 'user'. Deliberately tri-state so `useIsAdmin` can tell a
 * definitive "not an admin" (403 — safe to cache) apart from a transient network
 * failure (must NOT be cached, or an admin sticks as non-admin until reload).
 */
export type AdminProbeResult = 'admin' | 'forbidden' | 'network-error';

export async function probeAdmin(signal?: AbortSignal): Promise<AdminProbeResult> {
  try {
    const res = await authedFetch(`${ADMIN_BASE}/me`, { signal });
    if (res.ok) return 'admin';
    if (res.status === 401 || res.status === 403) return 'forbidden';
    // 5xx / anything else — treat as transient, don't let it cache a false.
    return 'network-error';
  } catch {
    // No bearer, offline, DNS, abort — transient by definition.
    return 'network-error';
  }
}

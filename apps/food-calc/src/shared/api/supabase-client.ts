import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { diagLog } from '@/shared/lib/observability/diagLog';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in env');
}

// Supabase usage in this app is auth-only:
//   - signIn/signUp/signOut/refreshSession/onAuthStateChange (5 endpoints)
//   - WSS realtime is unused
//   - REST/.from()/.storage()/.functions() are NOT called from the UI —
//     all data goes through our own Node backend (/api/backup/*).
//
// The previous version of this file routed every call through a Node proxy
// (/api/sb/*) to dodge iOS WebKit Bug #284946 (HTTP/2 pool poisoning when
// 9+ parallel REST requests share one connection). That bug only triggers
// with parallel REST traffic; with auth-only traffic (5 calls, never
// concurrent) there is nothing to poison. The proxy was also the source of
// a content-encoding regression — it forwarded `content-encoding: gzip`
// after Node's fetch had already decompressed the body, so the browser saw
// `200 OK` with empty / un-decodable bytes on signIn success.
// Removing the proxy: simpler, fewer bugs, no behaviour change for users.
//
// What we keep: per-call AbortSignal.timeout + diagLog for observability.

const FETCH_TIMEOUT_MS = 15_000;
// Auth endpoints (token exchange, signup, password reset, OTP) do bcrypt
// verify + JWT signing + session row insert + email send. On free tier with
// noisy-neighbour CPU contention they can spike past 5s on the SUCCESS path
// while a wrong-password call returns in <1s. Give auth a longer budget so
// users don't see "Нет связи с сервером" on a correct password.
const AUTH_FETCH_TIMEOUT_MS = 30_000;
let fetchSeq = 0;

function isAuthEndpoint(input: RequestInfo | URL): boolean {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return /\/auth\/v1\//.test(raw);
}

function shortUrl(input: RequestInfo | URL): string {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  try {
    const u = new URL(raw);
    return u.pathname + (u.search ? '?' + u.search.slice(0, 80) : '');
  } catch {
    return String(raw).slice(0, 120);
  }
}

const timedFetch: typeof fetch = async (input, init) => {
  const seq = ++fetchSeq;
  const userSignal = init?.signal;
  const hasAny = typeof (AbortSignal as unknown as { any?: unknown }).any === 'function';
  const budget = isAuthEndpoint(input) ? AUTH_FETCH_TIMEOUT_MS : FETCH_TIMEOUT_MS;
  const timeoutSignal = AbortSignal.timeout(budget);
  const signal =
    userSignal && hasAny
      ? AbortSignal.any([userSignal, timeoutSignal])
      : (userSignal ?? timeoutSignal);
  const t0 = performance.now();
  const url = shortUrl(input);
  const method = init?.method ?? 'GET';
  diagLog('[sb-fetch] START', { seq, method, url });
  try {
    const res = await fetch(input, { ...init, signal });
    const dt_ms = Math.round(performance.now() - t0);
    diagLog('[sb-fetch] END', {
      seq,
      method,
      url,
      dt_ms,
      status: res.status,
    });
    return res;
  } catch (err) {
    const dt_ms = Math.round(performance.now() - t0);
    const e = err as { name?: string; message?: string };
    diagLog('[sb-fetch] ERROR', {
      seq,
      method,
      url,
      dt_ms,
      name: e?.name,
      message: e?.message?.slice(0, 200),
    });
    throw err;
  }
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: { fetch: timedFetch },
});

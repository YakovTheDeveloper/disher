import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { diagLog } from '@/shared/lib/observability/diagLog';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in env');
}

// REST/Auth/Storage are routed through our own Node origin (Vite proxy
// forwards `/api/sb/*` to the backend, backend forwards to Supabase). This
// dodges iOS WebKit Bug #284946 because iPhone -> Node speaks HTTP/1.1, so
// there is no shared H2 stream pool to poison.
//
// Realtime (WSS) is left on the original URL — it is unaffected by #284946
// (separate transport, separate connection pool) and we'd only be adding a
// hop for nothing.
//
// Set VITE_SUPABASE_PROXY=0 to bypass the proxy and hit Supabase directly
// (useful for A/B testing the workaround).
const SUPABASE_PROXY_PREFIX = '/api/sb';
const PROXY_ENABLED = import.meta.env.VITE_SUPABASE_PROXY !== '0';
const supabaseOrigin = (() => {
  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return supabaseUrl;
  }
})();

function rewriteToProxy(input: RequestInfo | URL): RequestInfo | URL {
  if (!PROXY_ENABLED) return input;
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!raw.startsWith(supabaseOrigin)) return input;
  const tail = raw.slice(supabaseOrigin.length); // "/rest/v1/products?…"
  const proxied = SUPABASE_PROXY_PREFIX + tail;
  if (typeof input === 'string') return proxied;
  if (input instanceof URL) return new URL(proxied, window.location.origin);
  // Request object — clone with new URL but preserve method/headers/body/etc.
  return new Request(proxied, input);
}

// iOS 18 WebKit fetch regression — bug 284946 + Safari 18+ stale keep-alive.
// Diagnostic logs (2026-04-28) show that on iPhone 8 of 9 parallel REST
// requests stall on a single shared HTTP/2 connection while one breaks
// through. Desktop + Android on the same Wi-Fi handle the same parallel load
// instantly, so it is purely a WebKit transport quirk. Workaround:
//   1) On iOS, serialize Supabase REST fetches (concurrency = 1) so we never
//      multiplex into a poisoned H2 stream pool.
//   2) Use a shorter per-request timeout (5s) so a dead connection unblocks
//      the queue quickly instead of starving every later request 15s each.
//   3) Retry once on `TypeError: Load failed` (mid-flight kill) — opens a
//      fresh connection. Do NOT retry on our own AbortError until we have
//      evidence the next attempt would land on a different connection.
//   https://bugs.webkit.org/show_bug.cgi?id=284946
//   https://supabase.com/docs/guides/api/automatic-retries-in-supabase-js
const IS_IOS_WEBKIT = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || /CriOS\//.test(ua);
})();
const FETCH_TIMEOUT_MS = IS_IOS_WEBKIT ? 5_000 : 15_000;
const TRANSIENT_RETRY_MAX = 1;
const TRANSIENT_RETRY_DELAY_MS = 250;
let fetchSeq = 0;

function shortUrl(input: RequestInfo | URL): string {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  try {
    const u = new URL(raw);
    return u.pathname + (u.search ? '?' + u.search.slice(0, 80) : '');
  } catch {
    return String(raw).slice(0, 120);
  }
}

function isTransientFetchError(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null;
  if (!e) return false;
  // Only retry true mid-flight kills. Our own AbortError (timeout) means the
  // connection is poisoned — retrying onto the same H2 pool will just stall
  // again, so we let the caller (TanStack Query / outbox) decide.
  if (e.name === 'TypeError' && /load failed|network|fetch/i.test(e.message ?? '')) return true;
  return false;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// iOS-only: serialize Supabase REST fetches so we never multiplex 9+ parallel
// requests into a single WebKit H2 connection (which causes 8/9 to silently
// stall). Implemented as a chained promise queue — each new fetch waits for
// the previous one to settle before issuing.
let iosFetchTail: Promise<unknown> = Promise.resolve();
function serializeOnIos<T>(work: () => Promise<T>): Promise<T> {
  if (!IS_IOS_WEBKIT) return work();
  const next = iosFetchTail.then(work, work);
  // Don't poison the chain on errors — swallow them for the next link only.
  iosFetchTail = next.catch(() => undefined);
  return next;
}

async function runOneFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  seq: number,
  attempt: number,
): Promise<Response> {
  const userSignal = init?.signal;
  const hasAny = typeof (AbortSignal as unknown as { any?: unknown }).any === 'function';
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const signal =
    userSignal && hasAny
      ? AbortSignal.any([userSignal, timeoutSignal])
      : (userSignal ?? timeoutSignal);
  const t0 = performance.now();
  const proxied = rewriteToProxy(input);
  const url = shortUrl(proxied);
  const method = init?.method ?? 'GET';
  diagLog('[sb-fetch] START', { seq, attempt, method, url, ios: IS_IOS_WEBKIT, proxy: PROXY_ENABLED });
  try {
    const res = await fetch(proxied, { ...init, signal });
    const dt_ms = Math.round(performance.now() - t0);
    const serverDate = res.headers.get('date');
    const skewMs = serverDate ? Date.now() - new Date(serverDate).getTime() : null;
    diagLog('[sb-fetch] END', {
      seq,
      attempt,
      method,
      url,
      dt_ms,
      status: res.status,
      cfRay: res.headers.get('cf-ray'),
      cfCache: res.headers.get('cf-cache-status'),
      serverTiming: res.headers.get('server-timing'),
      altSvc: res.headers.get('alt-svc')?.slice(0, 80) ?? null,
      skewMs,
    });
    return res;
  } catch (err) {
    const dt_ms = Math.round(performance.now() - t0);
    const e = err as { name?: string; message?: string };
    diagLog('[sb-fetch] ERROR', {
      seq,
      attempt,
      method,
      url,
      dt_ms,
      name: e?.name,
      message: e?.message?.slice(0, 200),
    });
    throw err;
  }
}

const timedFetch: typeof fetch = (input, init) => {
  const seq = ++fetchSeq;
  return serializeOnIos(async () => {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= TRANSIENT_RETRY_MAX; attempt++) {
      try {
        return await runOneFetch(input, init, seq, attempt);
      } catch (err) {
        lastErr = err;
        const userAborted = init?.signal?.aborted === true;
        const transient = !userAborted && isTransientFetchError(err);
        if (!transient || attempt >= TRANSIENT_RETRY_MAX) throw err;
        await sleep(TRANSIENT_RETRY_DELAY_MS * (attempt + 1));
      }
    }
    throw lastErr;
  });
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

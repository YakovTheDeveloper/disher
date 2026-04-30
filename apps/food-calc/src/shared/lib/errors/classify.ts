import { isAuthError } from '@supabase/supabase-js';

export type ErrorKind =
  | { kind: 'network';     message: string; raw: unknown }
  | { kind: 'timeout';     message: string; raw: unknown }
  | { kind: 'auth';        message: string; status?: 401 | 403 | number; code?: string; raw: unknown }
  | { kind: 'validation';  message: string; status?: 400 | 422 | number; code?: string; fieldErrors?: Record<string, string>; raw: unknown }
  | { kind: 'not_found';   message: string; status: 404; code?: string; raw: unknown }
  | { kind: 'rate_limit';  message: string; status: 429; retryAfter?: number; raw: unknown }
  | { kind: 'server';      message: string; status: number; code?: string; raw: unknown }
  | { kind: 'unknown';     message: string; raw: unknown };

const NETWORK_TEXT_RE = /load failed|failed to fetch|network ?error|networkerror|fetch failed|err_network|network request failed/i;
const TIMEOUT_TEXT_RE = /timed? ?out|timeout|aborted/i;

function messageOf(err: unknown, fallback = 'Что-то пошло не так'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

function isResponseLike(err: unknown): err is { status: number; statusText?: string; url?: string; headers?: Headers } {
  return typeof err === 'object' && err !== null && typeof (err as { status?: unknown }).status === 'number';
}

function classifyByStatus(status: number, message: string, raw: unknown, extras: { code?: string; retryAfter?: number; fieldErrors?: Record<string, string> } = {}): ErrorKind {
  if (status === 401 || status === 403) return { kind: 'auth', status, message, code: extras.code, raw };
  if (status === 404) return { kind: 'not_found', status, message, code: extras.code, raw };
  if (status === 429) return { kind: 'rate_limit', status, message, retryAfter: extras.retryAfter, raw };
  if (status === 400 || status === 422) return { kind: 'validation', status, message, code: extras.code, fieldErrors: extras.fieldErrors, raw };
  if (status >= 500 || status >= 400) return { kind: 'server', status, message, code: extras.code, raw };
  return { kind: 'unknown', message, raw };
}

export function classifyError(err: unknown): ErrorKind {
  if (err === null || err === undefined) {
    return { kind: 'unknown', message: 'Что-то пошло не так', raw: err };
  }

  // Supabase AuthError — semantic auth boundary EXCEPT for AuthRetryableFetchError,
  // which supabase-js throws when the underlying fetch fails (Safari "Load failed",
  // Chromium "Failed to fetch", or 502/503/504/52x gateway errors). These are NOT
  // credential problems and must surface as network/server so the user sees the
  // right toast and we don't blame the password during an outage.
  if (isAuthError(err)) {
    const e = err as Error & { status?: number; code?: string; name: string };
    if (e.name === 'AuthRetryableFetchError') {
      // status===0 = the browser never got a response (network/CORS/offline/Safari).
      if (!e.status || e.status === 0) {
        return { kind: 'network', message: messageOf(e, 'Нет связи с сервером'), raw: err };
      }
      // 502/503/504/52x = upstream/gateway — supabase considers these retryable.
      if (e.status >= 500) {
        return { kind: 'server', message: messageOf(e), status: e.status, raw: err };
      }
    }
    return { kind: 'auth', message: e.message, status: e.status, code: e.code, raw: err };
  }

  // AbortError / DOMException timeout
  if (err instanceof DOMException) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError' || TIMEOUT_TEXT_RE.test(err.message)) {
      return { kind: 'timeout', message: messageOf(err, 'Превышено время ожидания'), raw: err };
    }
  }

  // TypeError from fetch — network failure
  if (err instanceof TypeError) {
    if (NETWORK_TEXT_RE.test(err.message)) {
      return { kind: 'network', message: messageOf(err, 'Нет связи с сервером'), raw: err };
    }
  }

  // Response-like (HTTP error wrapped or thrown)
  if (isResponseLike(err)) {
    const r = err as { status: number; statusText?: string; headers?: Headers };
    const message = r.statusText || `HTTP ${r.status}`;
    const retryAfterHeader = r.headers?.get?.('retry-after');
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    return classifyByStatus(r.status, message, err, { retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined });
  }

  // Generic Error — last-resort text-based detection
  if (err instanceof Error) {
    if (NETWORK_TEXT_RE.test(err.message)) {
      return { kind: 'network', message: err.message, raw: err };
    }
    if (TIMEOUT_TEXT_RE.test(err.message) && err.name !== 'Error') {
      return { kind: 'timeout', message: err.message, raw: err };
    }
    return { kind: 'unknown', message: err.message, raw: err };
  }

  return { kind: 'unknown', message: messageOf(err), raw: err };
}

const RU_TEXT: Record<ErrorKind['kind'], string> = {
  network: 'Нет связи с сервером',
  timeout: 'Сервер не отвечает',
  auth: 'Проблема с авторизацией',
  validation: 'Проверьте введённые данные',
  not_found: 'Не найдено',
  rate_limit: 'Слишком много запросов, подождите',
  server: 'Сбой на сервере',
  unknown: 'Что-то пошло не так',
};

function prodMessage(kind: ErrorKind): string {
  if (kind.kind === 'auth' && kind.code === 'invalid_credentials') return 'Неверный email или пароль';
  if (kind.kind === 'auth' && kind.code === 'email_not_confirmed') return 'Подтвердите email перед входом';
  if (kind.kind === 'auth' && kind.code === 'user_already_exists') return 'Аккаунт с таким email уже есть';
  if (kind.kind === 'auth' && kind.code === 'weak_password') return 'Слишком простой пароль';
  if (kind.kind === 'validation' && kind.message) return kind.message;
  return RU_TEXT[kind.kind];
}

function debugSuffix(kind: ErrorKind): string {
  const parts: string[] = [kind.kind];
  if ('status' in kind && kind.status !== undefined) parts.push(`${kind.status}`);
  if ('code' in kind && kind.code) parts.push(kind.code);
  return parts.join(' ');
}

/**
 * Public message shown in toaster / inline UI errors.
 * - In **dev** prepends `[kind status code]` + raw message so the cause is visible at a glance.
 * - In **prod** shows only the localized human text (raw error goes to Sentry/diagLog/mutationLog).
 *
 * Override-able via `isDev` for tests.
 */
export function defaultUserMessage(kind: ErrorKind, isDev: boolean = import.meta.env.DEV): string {
  const prod = prodMessage(kind);
  if (!isDev) return prod;
  const tag = `[${debugSuffix(kind)}]`;
  return kind.message && kind.message !== prod
    ? `${tag} ${prod} — ${kind.message}`
    : `${tag} ${prod}`;
}

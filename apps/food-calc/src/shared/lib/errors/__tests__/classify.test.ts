import { describe, it, expect } from 'vitest';
import { AuthError, AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { classifyError, defaultUserMessage } from '../classify';

// ─── network ─────────────────────────────────────────────────────────────────

describe('classifyError → network', () => {
  it('TypeError "Load failed" → network (Safari)', () => {
    const r = classifyError(new TypeError('Load failed'));
    expect(r.kind).toBe('network');
    expect(r.message).toBe('Load failed');
  });

  it('TypeError "Failed to fetch" → network (Chromium)', () => {
    const r = classifyError(new TypeError('Failed to fetch'));
    expect(r.kind).toBe('network');
  });

  it('TypeError "NetworkError when attempting to fetch" → network (Firefox)', () => {
    const r = classifyError(new TypeError('NetworkError when attempting to fetch resource'));
    expect(r.kind).toBe('network');
  });

  it('Generic Error with "network error" message → network', () => {
    const r = classifyError(new Error('network error'));
    expect(r.kind).toBe('network');
  });

  // Regression — supabase wraps fetch failures (Safari "Load failed",
  // Chromium "Failed to fetch", offline) in AuthRetryableFetchError with
  // status=0. isAuthError() returns true for this class, so the previous
  // implementation classified it as `auth` and the user saw "Проблема с
  // авторизацией" / "Load failed" while the password was correct.
  it('AuthRetryableFetchError("Load failed", 0) → network, NOT auth (Safari fetch failure)', () => {
    const e = new AuthRetryableFetchError('Load failed', 0);
    const r = classifyError(e);
    expect(r.kind).toBe('network');
    expect(r.message).toBe('Load failed');
  });

  it('AuthRetryableFetchError("Failed to fetch", 0) → network (Chromium offline)', () => {
    const e = new AuthRetryableFetchError('Failed to fetch', 0);
    expect(classifyError(e).kind).toBe('network');
  });

  it('AuthRetryableFetchError with 502/503/504 → server (gateway / cloudflare)', () => {
    for (const status of [502, 503, 504, 521]) {
      const e = new AuthRetryableFetchError('upstream down', status);
      const r = classifyError(e);
      expect(r.kind, `status ${status} should map to server`).toBe('server');
    }
  });
});

// ─── timeout — supabase wraps AbortSignal.timeout failures ───────────────────

describe('classifyError → timeout (supabase wrapped)', () => {
  // Regression: success-path signIn was hitting our 5s iOS fetch timeout (the
  // /token?grant_type=password endpoint can take 1-3s for bcrypt verify;
  // through the /api/sb/* proxy it can exceed 5s). AbortSignal.timeout fires,
  // supabase wraps the AbortError as AuthRetryableFetchError(message, 0), and
  // the previous classify mapped it to `network` ("Нет связи с сервером") even
  // though the network was fine. Fixed by checking timeout-text in the message
  // BEFORE the network bucket.
  it('AuthRetryableFetchError("signal is aborted without reason", 0) → timeout (Chromium AbortSignal.timeout)', () => {
    const e = new AuthRetryableFetchError('signal is aborted without reason', 0);
    expect(classifyError(e).kind).toBe('timeout');
  });

  it('AuthRetryableFetchError("The operation was aborted.", 0) → timeout (Safari)', () => {
    const e = new AuthRetryableFetchError('The operation was aborted.', 0);
    expect(classifyError(e).kind).toBe('timeout');
  });

  it('AuthRetryableFetchError("AbortError: aborted", 0) → timeout (firefox-style)', () => {
    const e = new AuthRetryableFetchError('AbortError: aborted', 0);
    expect(classifyError(e).kind).toBe('timeout');
  });

  it('Real AbortError (not wrapped) still classifies as timeout', () => {
    const e = new DOMException('signal is aborted without reason', 'AbortError');
    expect(classifyError(e).kind).toBe('timeout');
  });

  it('AuthRetryableFetchError("Load failed", 0) STAYS network (timeout regex must not match)', () => {
    // Sanity: ensure the timeout-first check didn't accidentally swallow real
    // network errors. "Load failed" has no abort/timeout token in it.
    const e = new AuthRetryableFetchError('Load failed', 0);
    expect(classifyError(e).kind).toBe('network');
  });
});

// ─── timeout ─────────────────────────────────────────────────────────────────

describe('classifyError → timeout', () => {
  it('AbortError DOMException → timeout', () => {
    const e = new DOMException('aborted', 'AbortError');
    expect(classifyError(e).kind).toBe('timeout');
  });

  it('TimeoutError DOMException → timeout', () => {
    const e = new DOMException('timeout', 'TimeoutError');
    expect(classifyError(e).kind).toBe('timeout');
  });
});

// ─── auth ────────────────────────────────────────────────────────────────────

describe('classifyError → auth', () => {
  it('Supabase AuthApiError 400 invalid_credentials → auth (status preserved)', () => {
    const e = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials');
    const r = classifyError(e);
    expect(r.kind).toBe('auth');
    if (r.kind === 'auth') {
      expect(r.code).toBe('invalid_credentials');
      expect(r.status).toBe(400);
    }
  });

  it('AuthError 401 → auth', () => {
    const e = new AuthError('Unauthorized', 401, 'no_authorization');
    const r = classifyError(e);
    expect(r.kind).toBe('auth');
    if (r.kind === 'auth') {
      expect(r.status).toBe(401);
      expect(r.code).toBe('no_authorization');
    }
  });

  it('AuthError without status, code=invalid_credentials → auth', () => {
    const e = new AuthError('bad creds');
    Object.assign(e, { code: 'invalid_credentials' });
    const r = classifyError(e);
    expect(r.kind).toBe('auth');
  });

  it('plain HTTP-like 403 → auth', () => {
    const r = classifyError({ status: 403, statusText: 'Forbidden' });
    expect(r.kind).toBe('auth');
  });
});

// ─── validation ──────────────────────────────────────────────────────────────

describe('classifyError → validation', () => {
  it('HTTP-like 400 → validation', () => {
    const r = classifyError({ status: 400, statusText: 'Bad Request' });
    expect(r.kind).toBe('validation');
  });

  it('HTTP-like 422 → validation', () => {
    const r = classifyError({ status: 422, statusText: 'Unprocessable' });
    expect(r.kind).toBe('validation');
  });
});

// ─── not_found ───────────────────────────────────────────────────────────────

describe('classifyError → not_found', () => {
  it('HTTP-like 404 → not_found', () => {
    const r = classifyError({ status: 404, statusText: 'Not Found' });
    expect(r.kind).toBe('not_found');
    if (r.kind === 'not_found') expect(r.status).toBe(404);
  });
});

// ─── rate_limit ──────────────────────────────────────────────────────────────

describe('classifyError → rate_limit', () => {
  it('HTTP-like 429 → rate_limit', () => {
    const r = classifyError({ status: 429, statusText: 'Too Many Requests' });
    expect(r.kind).toBe('rate_limit');
  });

  it('HTTP-like 429 with retry-after header → rate_limit + retryAfter', () => {
    const headers = new Headers({ 'retry-after': '30' });
    const r = classifyError({ status: 429, statusText: 'Too Many Requests', headers });
    expect(r.kind).toBe('rate_limit');
    if (r.kind === 'rate_limit') expect(r.retryAfter).toBe(30);
  });
});

// ─── server ──────────────────────────────────────────────────────────────────

describe('classifyError → server', () => {
  it('HTTP-like 500 → server', () => {
    const r = classifyError({ status: 500, statusText: 'Internal Server Error' });
    expect(r.kind).toBe('server');
    if (r.kind === 'server') expect(r.status).toBe(500);
  });

  it('HTTP-like 503 → server', () => {
    const r = classifyError({ status: 503, statusText: 'Service Unavailable' });
    expect(r.kind).toBe('server');
  });
});

// ─── unknown ─────────────────────────────────────────────────────────────────

describe('classifyError → unknown', () => {
  it('null → unknown', () => {
    expect(classifyError(null).kind).toBe('unknown');
  });

  it('undefined → unknown', () => {
    expect(classifyError(undefined).kind).toBe('unknown');
  });

  it('plain Error with arbitrary text → unknown', () => {
    const r = classifyError(new Error('oops something broke'));
    expect(r.kind).toBe('unknown');
    expect(r.message).toBe('oops something broke');
  });

  it('plain object without status → unknown', () => {
    const r = classifyError({ foo: 'bar' });
    expect(r.kind).toBe('unknown');
  });

  it('string → unknown', () => {
    const r = classifyError('boom');
    expect(r.kind).toBe('unknown');
    expect(r.message).toBe('boom');
  });
});

// ─── defaultUserMessage (PROD) ───────────────────────────────────────────────

describe('defaultUserMessage prod', () => {
  it('auth invalid_credentials → russian text', () => {
    const e = new AuthError('Invalid login credentials', 401, 'invalid_credentials');
    const k = classifyError(e);
    expect(defaultUserMessage(k, false)).toBe('Неверный email или пароль');
  });

  it('auth email_not_confirmed → russian text', () => {
    const e = new AuthError('Email not confirmed', 401, 'email_not_confirmed');
    const k = classifyError(e);
    expect(defaultUserMessage(k, false)).toBe('Подтвердите email перед входом');
  });

  it('network → "Нет связи с сервером"', () => {
    const k = classifyError(new TypeError('Load failed'));
    expect(defaultUserMessage(k, false)).toBe('Нет связи с сервером');
  });

  it('timeout → "Сервер не отвечает"', () => {
    const k = classifyError(new DOMException('aborted', 'AbortError'));
    expect(defaultUserMessage(k, false)).toBe('Сервер не отвечает');
  });

  it('rate_limit → "Слишком много запросов"', () => {
    const k = classifyError({ status: 429, statusText: 'Too Many' });
    expect(defaultUserMessage(k, false)).toContain('Слишком много');
  });

  it('unknown → "Что-то пошло не так"', () => {
    expect(defaultUserMessage(classifyError(null), false)).toBe('Что-то пошло не так');
  });
});

// ─── defaultUserMessage (DEV) ────────────────────────────────────────────────

describe('defaultUserMessage dev', () => {
  it('prepends [kind status code] tag with raw message', () => {
    const e = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials');
    const k = classifyError(e);
    const msg = defaultUserMessage(k, true);
    expect(msg).toContain('[auth 400 invalid_credentials]');
    expect(msg).toContain('Invalid login credentials');
  });

  it('network TypeError → tag "[network]" + raw', () => {
    const k = classifyError(new TypeError('Load failed'));
    const msg = defaultUserMessage(k, true);
    expect(msg).toContain('[network]');
    expect(msg).toContain('Load failed');
  });

  it('500 server → tag "[server 500]"', () => {
    const k = classifyError({ status: 500, statusText: 'Internal Server Error' });
    const msg = defaultUserMessage(k, true);
    expect(msg).toContain('[server 500]');
  });
});

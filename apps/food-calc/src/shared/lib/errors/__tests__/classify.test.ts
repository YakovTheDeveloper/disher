import { describe, it, expect } from 'vitest';
import { classifyError, defaultUserMessage, type ErrorKind } from '../classify';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';

// classify.ts is fully vendor-agnostic since the better-auth migration —
// classifyError consumes plain TypeError / DOMException / HTTP-shaped objects
// only. better-auth's own error envelope is mapped to ErrorKind upstream in
// classifyBetterAuthError (betterAuthProvider.ts), which is why the prod-message
// `auth + code` cases below are constructed as ErrorKind directly rather than
// fed through classifyError.

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
  it('plain HTTP-like 403 → auth', () => {
    const r = classifyError({ status: 403, statusText: 'Forbidden' });
    expect(r.kind).toBe('auth');
  });

  it('plain HTTP-like 401 → auth (status preserved)', () => {
    const r = classifyError({ status: 401, statusText: 'Unauthorized' });
    expect(r.kind).toBe('auth');
    if (r.kind === 'auth') expect(r.status).toBe(401);
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

// ─── payment_required ────────────────────────────────────────────────────────

describe('classifyError → payment_required', () => {
  it('PaymentRequiredError → payment_required (status 402, need/have preserved)', () => {
    const r = classifyError(new PaymentRequiredError(200, 50));
    expect(r.kind).toBe('payment_required');
    if (r.kind === 'payment_required') {
      expect(r.status).toBe(402);
      expect(r.needKop).toBe(200);
      expect(r.haveKop).toBe(50);
      expect(r.message).toBe('Недостаточно средств — пополните баланс');
    }
  });

  it('HTTP-like 402 → payment_required', () => {
    const r = classifyError({ status: 402, statusText: 'Payment Required' });
    expect(r.kind).toBe('payment_required');
    if (r.kind === 'payment_required') expect(r.status).toBe(402);
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
  // The `auth + code` pairs are produced by classifyBetterAuthError, not by
  // classifyError — construct ErrorKind directly to pin the prodMessage map.
  it('auth invalid_credentials → russian text', () => {
    const k: ErrorKind = { kind: 'auth', status: 401, code: 'invalid_credentials', message: 'Invalid login credentials', raw: null };
    expect(defaultUserMessage(k, false)).toBe('Неверный email или пароль');
  });

  it('auth email_not_confirmed → russian text', () => {
    const k: ErrorKind = { kind: 'auth', status: 403, code: 'email_not_confirmed', message: 'Email not confirmed', raw: null };
    expect(defaultUserMessage(k, false)).toBe('Подтвердите email перед входом');
  });

  it('auth user_already_exists → russian text', () => {
    const k: ErrorKind = { kind: 'auth', status: 400, code: 'user_already_exists', message: 'User exists', raw: null };
    expect(defaultUserMessage(k, false)).toBe('Аккаунт с таким email уже есть');
  });

  it('auth weak_password → russian text', () => {
    const k: ErrorKind = { kind: 'auth', status: 400, code: 'weak_password', message: 'Password too short', raw: null };
    expect(defaultUserMessage(k, false)).toBe('Слишком простой пароль');
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

  it('payment_required → "Недостаточно средств — пополните баланс"', () => {
    const k = classifyError(new PaymentRequiredError(200, 50));
    expect(defaultUserMessage(k, false)).toBe('Недостаточно средств — пополните баланс');
  });

  it('unknown → "Что-то пошло не так"', () => {
    expect(defaultUserMessage(classifyError(null), false)).toBe('Что-то пошло не так');
  });
});

// ─── defaultUserMessage (DEV) ────────────────────────────────────────────────

describe('defaultUserMessage dev', () => {
  it('prepends [kind status code] tag with raw message', () => {
    const k: ErrorKind = { kind: 'auth', status: 400, code: 'invalid_credentials', message: 'Invalid login credentials', raw: null };
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

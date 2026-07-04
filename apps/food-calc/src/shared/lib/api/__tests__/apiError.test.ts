import { describe, it, expect } from 'vitest';
import { readApiError, throwApiError, PaymentRequiredError } from '../apiError';

// Minimal Response stand-ins — readApiError/throwApiError touch `status`,
// `json()`, and `headers.get('x-request-id')` (the request-id fallback). A real
// Response always carries `.headers`, so the fakes do too.
function jsonRes(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}
function nonJsonRes(status: number): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    json: async () => {
      throw new SyntaxError('Unexpected token < in JSON');
    },
  } as unknown as Response;
}

describe('readApiError', () => {
  it('402 → paymentRequired with the localized RU message + need/have', async () => {
    const e = await readApiError(jsonRes(402, { needKop: 200, haveKop: 50 }));
    expect(e).toEqual({
      status: 402,
      paymentRequired: true,
      needKop: 200,
      haveKop: 50,
      message: 'Недостаточно средств — пополните баланс',
    });
  });

  it('402 keeps the localized message even when the body carries its own `error`', async () => {
    const e = await readApiError(jsonRes(402, { error: 'insufficient_funds' }));
    expect(e.paymentRequired).toBe(true);
    expect(e.message).toBe('Недостаточно средств — пополните баланс');
  });

  it('402 with non-numeric need/have → undefined (not coerced)', async () => {
    const e = await readApiError(jsonRes(402, { needKop: 'lots', haveKop: null }));
    expect(e.needKop).toBeUndefined();
    expect(e.haveKop).toBeUndefined();
  });

  it('non-402 with a string `error` body → that message, paymentRequired false', async () => {
    const e = await readApiError(jsonRes(400, { error: 'Слишком длинный текст' }));
    expect(e.paymentRequired).toBe(false);
    expect(e.status).toBe(400);
    expect(e.message).toBe('Слишком длинный текст');
  });

  it('non-402 with a non-JSON body → `HTTP <status>`', async () => {
    const e = await readApiError(nonJsonRes(500));
    expect(e.message).toBe('HTTP 500');
    expect(e.paymentRequired).toBe(false);
  });

  it('non-402 JSON body lacking `error` → `HTTP <status>`', async () => {
    const e = await readApiError(jsonRes(503, { somethingElse: true }));
    expect(e.message).toBe('HTTP 503');
  });
});

describe('throwApiError', () => {
  it('402 → throws PaymentRequiredError carrying need/have', async () => {
    const err = await throwApiError(jsonRes(402, { needKop: 200, haveKop: 50 })).catch((e) => e);
    expect(err).toBeInstanceOf(PaymentRequiredError);
    expect(err.message).toBe('Недостаточно средств — пополните баланс');
    expect(err.needKop).toBe(200);
    expect(err.haveKop).toBe(50);
  });

  it('non-402 → throws a plain Error with the backend message (NOT PaymentRequiredError)', async () => {
    const err = await throwApiError(jsonRes(500, { error: 'kaboom' })).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(PaymentRequiredError);
    expect(err.message).toBe('kaboom');
  });

  it('non-402 non-JSON → throws Error(`HTTP <status>`)', async () => {
    const err = await throwApiError(nonJsonRes(400)).catch((e) => e);
    expect(err).not.toBeInstanceOf(PaymentRequiredError);
    expect(err.message).toBe('HTTP 400');
  });
});

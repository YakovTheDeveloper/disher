import { beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';
import { parseFreeTextFood, type ParseResponse } from '../parseFreeTextFood';
import { parseDishName } from '../parseDishName';

const mockFetch = vi.mocked(authedFetch);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonRes(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}

const emptyParse: ParseResponse = {
  requestId: 'srv-1',
  resolved: [],
  ambiguous: [],
  unresolved: [],
};

beforeEach(() => mockFetch.mockReset());

// Both LLM heads share the SAME ParseResponse shape and the SAME 402 +
// X-Request-Id idempotency contract — drive them through one table so the two
// stay in lockstep.
const fetchers = [
  {
    name: 'parseFreeTextFood (head B — free text)',
    call: () => parseFreeTextFood('омлет'),
    endpoint: '/api/free-text-food/parse',
    bodyKey: 'text',
    bodyVal: 'омлет',
  },
  {
    name: 'parseDishName (head A — infer recipe)',
    call: () => parseDishName('борщ'),
    endpoint: '/api/suggestions/dish-products',
    bodyKey: 'dishName',
    bodyVal: 'борщ',
  },
] as const;

describe('parseDishName — «Уточнения» comment', () => {
  it('includes a trimmed comment in the body when provided', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
    await parseDishName('плов', '  вегетарианский  ');
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ dishName: 'плов', comment: 'вегетарианский' });
  });

  it('omits the comment key entirely when empty/whitespace (preserves the no-comment cache key)', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
    await parseDishName('плов', '   ');
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ dishName: 'плов' });
    expect('comment' in body).toBe(false);
  });
});

for (const f of fetchers) {
  describe(f.name, () => {
    it('returns the parsed response on 200', async () => {
      mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
      await expect(f.call()).resolves.toEqual(emptyParse);
    });

    it('throws PaymentRequiredError on 402 (carries need/have)', async () => {
      mockFetch.mockResolvedValue(jsonRes(402, { needKop: 50, haveKop: 0 }));
      const err = await f.call().catch((e) => e);
      expect(err).toBeInstanceOf(PaymentRequiredError);
      expect(err.message).toBe('Недостаточно средств — пополните баланс');
      expect(err.needKop).toBe(50);
    });

    it('throws a plain Error (not 402) on other non-ok responses', async () => {
      mockFetch.mockResolvedValue(jsonRes(500, { error: 'boom' }));
      const err = await f.call().catch((e) => e);
      expect(err).toBeInstanceOf(Error);
      expect(err).not.toBeInstanceOf(PaymentRequiredError);
      expect(err.message).toBe('boom');
    });

    it(`POSTs to ${f.endpoint} with an X-Request-Id header + the right body`, async () => {
      mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
      await f.call();
      const call = mockFetch.mock.calls[0];
      expect(call?.[0]).toContain(f.endpoint);
      expect(call?.[1]?.method).toBe('POST');
      const headers = call?.[1]?.headers as Record<string, string>;
      expect(headers['X-Request-Id']).toMatch(UUID_RE);
      expect(JSON.parse(String(call?.[1]?.body))[f.bodyKey]).toBe(f.bodyVal);
    });

    it('generates a fresh X-Request-Id per call (idempotency key is per-attempt)', async () => {
      mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
      await f.call();
      await f.call();
      const h0 = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
      const h1 = mockFetch.mock.calls[1]?.[1]?.headers as Record<string, string>;
      expect(h0['X-Request-Id']).not.toBe(h1['X-Request-Id']);
    });
  });
}

import { beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';
import { parseFreeTextFood, type ParseResponse } from '../parseFreeTextFood';
import { parseDishName } from '../parseDishName';

const mockFetch = vi.mocked(authedFetch);

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
// stay in lockstep. The requestId is now CALLER-OWNED (fix #4/#5): each call
// takes it as an argument and forwards it verbatim as the X-Request-Id header.
const fetchers = [
  {
    name: 'parseFreeTextFood (head B — free text)',
    call: (requestId: string) => parseFreeTextFood('омлет', requestId),
    endpoint: '/api/free-text-food/parse',
    bodyKey: 'text',
    bodyVal: 'омлет',
  },
  {
    name: 'parseDishName (head A — infer recipe)',
    call: (requestId: string) => parseDishName('борщ', requestId),
    endpoint: '/api/suggestions/dish-products',
    bodyKey: 'dishName',
    bodyVal: 'борщ',
  },
] as const;

describe('parseDishName — «Уточнения» comment', () => {
  it('includes a trimmed comment in the body when provided', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
    await parseDishName('плов', 'req-1', '  вегетарианский  ');
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ dishName: 'плов', comment: 'вегетарианский' });
  });

  it('omits the comment key entirely when empty/whitespace (preserves the no-comment cache key)', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
    await parseDishName('плов', 'req-1', '   ');
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ dishName: 'плов' });
    expect('comment' in body).toBe(false);
  });
});

for (const f of fetchers) {
  describe(f.name, () => {
    it('returns the parsed response on 200', async () => {
      mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
      await expect(f.call('req-1')).resolves.toEqual(emptyParse);
    });

    it('throws PaymentRequiredError on 402 (carries need/have)', async () => {
      mockFetch.mockResolvedValue(jsonRes(402, { needKop: 50, haveKop: 0 }));
      const err = await f.call('req-1').catch((e) => e);
      expect(err).toBeInstanceOf(PaymentRequiredError);
      expect(err.message).toBe('Недостаточно средств — пополните баланс');
      expect(err.needKop).toBe(50);
    });

    it('throws a plain Error (not 402) on other non-ok responses', async () => {
      mockFetch.mockResolvedValue(jsonRes(500, { error: 'boom' }));
      const err = await f.call('req-1').catch((e) => e);
      expect(err).toBeInstanceOf(Error);
      expect(err).not.toBeInstanceOf(PaymentRequiredError);
      expect(err.message).toBe('boom');
    });

    it(`POSTs to ${f.endpoint} forwarding the caller's X-Request-Id + the right body`, async () => {
      mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
      await f.call('req-abc');
      const call = mockFetch.mock.calls[0];
      expect(call?.[0]).toContain(f.endpoint);
      expect(call?.[1]?.method).toBe('POST');
      const headers = call?.[1]?.headers as Record<string, string>;
      // The header is the id the caller passed — NOT a freshly minted one.
      expect(headers['X-Request-Id']).toBe('req-abc');
      expect(JSON.parse(String(call?.[1]?.body))[f.bodyKey]).toBe(f.bodyVal);
    });

    // Fix #4/#5: the idempotency key is stable PER LOGICAL REQUEST. When the
    // caller re-issues the same request with the same id (grace-resubmit or
    // manual retry), the SAME X-Request-Id must ride both fetches so the server
    // dedups the charge. (This inverts the old test, which asserted a fresh id
    // per call — that behaviour was the double-charge bug.)
    it('forwards the SAME X-Request-Id when the caller reuses the id (idempotent retry)', async () => {
      mockFetch.mockResolvedValue(jsonRes(200, emptyParse));
      await f.call('stable-req-id');
      await f.call('stable-req-id');
      const h0 = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
      const h1 = mockFetch.mock.calls[1]?.[1]?.headers as Record<string, string>;
      expect(h0['X-Request-Id']).toBe('stable-req-id');
      expect(h1['X-Request-Id']).toBe('stable-req-id');
    });
  });
}

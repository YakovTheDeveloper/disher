import { beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { fetchBalance, fetchLedger, type LedgerEntry } from '../billing';

const mockFetch = vi.mocked(authedFetch);

function jsonRes(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => mockFetch.mockReset());

describe('fetchBalance', () => {
  it('returns the parsed balance on 200', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, { balanceKop: 4950, balanceRub: 49.5 }));
    await expect(fetchBalance()).resolves.toEqual({ balanceKop: 4950, balanceRub: 49.5 });
  });

  it('hits GET /api/balance', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, { balanceKop: 0, balanceRub: 0 }));
    await fetchBalance();
    expect(mockFetch.mock.calls[0]?.[0]).toMatch(/\/api\/balance$/);
  });

  it('throws on a non-ok response', async () => {
    mockFetch.mockResolvedValue(jsonRes(500, {}));
    await expect(fetchBalance()).rejects.toThrow('GET /api/balance 500');
  });
});

describe('fetchLedger', () => {
  const items: LedgerEntry[] = [
    {
      id: 'l1',
      amountKop: -50,
      balanceAfterKop: 4900,
      kind: 'charge',
      feature: 'free_text_parse',
      requestId: 'r1',
      createdAt: '2026-06-08T00:00:00.000Z',
    },
  ];

  it('returns the items array on 200', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, { items }));
    await expect(fetchLedger()).resolves.toEqual(items);
  });

  it('returns [] when the body has no items', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, {}));
    await expect(fetchLedger()).resolves.toEqual([]);
  });

  it('passes the limit through to the query string (default 20, custom honored)', async () => {
    mockFetch.mockResolvedValue(jsonRes(200, { items: [] }));
    await fetchLedger();
    expect(mockFetch.mock.calls[0]?.[0]).toContain('limit=20');
    await fetchLedger(8);
    expect(mockFetch.mock.calls[1]?.[0]).toContain('limit=8');
  });

  it('throws on a non-ok response', async () => {
    mockFetch.mockResolvedValue(jsonRes(401, {}));
    await expect(fetchLedger()).rejects.toThrow('GET /api/balance/ledger 401');
  });
});

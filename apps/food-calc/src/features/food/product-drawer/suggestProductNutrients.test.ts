import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the transport + base URL; keep the real apiError helpers and the real
// nutrient catalog so the name→id mapping is exercised against production data.
const authedFetchMock = vi.fn();
vi.mock('@/shared/lib/api/authedFetch', () => ({
  authedFetch: (...args: unknown[]) => authedFetchMock(...args),
}));
vi.mock('@/shared/lib/api/base', () => ({ API_BASE: 'http://test' }));

import { suggestProductNutrients } from './suggestProductNutrients';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}
function errResponse(status: number, body: unknown): Response {
  return { ok: false, status, json: async () => body } as Response;
}

beforeEach(() => authedFetchMock.mockReset());

describe('suggestProductNutrients', () => {
  it('maps name-keyed values to nutrient ids, dropping zero/negative/unknown keys', async () => {
    authedFetchMock.mockResolvedValue(
      okResponse({ values: { protein: 16, fats: 9, water: 0, bogus: 5, iron: -1 } }),
    );
    // protein id=1, fats id=2 (water:0, iron:-1, bogus(unknown) all dropped).
    expect(await suggestProductNutrients('творог')).toEqual({ '1': 16, '2': 9 });
  });

  it('returns an empty record when the LLM gives nothing (caller must not wipe)', async () => {
    authedFetchMock.mockResolvedValue(okResponse({ values: {} }));
    expect(await suggestProductNutrients('пусто')).toEqual({});
  });

  it('tolerates a missing values field', async () => {
    authedFetchMock.mockResolvedValue(okResponse({}));
    expect(await suggestProductNutrients('кривой ответ')).toEqual({});
  });

  it('throws PaymentRequiredError on 402', async () => {
    authedFetchMock.mockResolvedValue(
      errResponse(402, { error: 'insufficient_balance', needKop: 50, haveKop: 0 }),
    );
    await expect(suggestProductNutrients('дорого')).rejects.toBeInstanceOf(
      PaymentRequiredError,
    );
  });

  it('POSTs the product name + a nutrient spec to the right endpoint', async () => {
    authedFetchMock.mockResolvedValue(okResponse({ values: {} }));
    await suggestProductNutrients('куриная грудка');
    const [url, init] = authedFetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://test/api/suggestions/product-nutrients');
    const body = JSON.parse(init.body as string);
    expect(body.productName).toBe('куриная грудка');
    expect(Array.isArray(body.nutrients)).toBe(true);
    expect(body.nutrients.length).toBeGreaterThan(10);
    expect(body.nutrients[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        label: expect.any(String),
        unit: expect.any(String),
      }),
    );
  });
});

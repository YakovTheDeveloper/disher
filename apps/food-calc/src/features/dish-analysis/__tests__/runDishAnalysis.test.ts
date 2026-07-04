import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { db } from '@/shared/lib/dexie/schema';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';
import { buildDishAnalysisPayload, requestDishAnalysis } from '../api/runDishAnalysis';
import type { DishAnalysisPayload } from '../api/types';

const ISO = '2026-05-13T10:00:00.000Z';

async function clearDb() {
  await Promise.all([
    db.dishes.clear(),
    db.dish_items.clear(),
    db.products.clear(),
  ]);
}

beforeEach(clearDb);
afterEach(clearDb);

describe('buildDishAnalysisPayload', () => {
  it('hydrates dish + ingredients with names from Dexie products', async () => {
    await db.dishes.add({ id: 'd1', name: 'Борщ', created_at: ISO });
    await db.products.add({
      id: 'p-svekla',
      name: 'свёкла',
      source: '',
      nutrients: {},
      portions: [],
      categories: [],
      serving_basis: '100g',
      serving_unit: null,
      created_at: ISO,
    });
    await db.dish_items.add({
      id: 'di1',
      dish_id: 'd1',
      product_id: 'p-svekla',
      quantity: 250,
      details: 'печёная',
      created_at: ISO,
    });

    const out = await buildDishAnalysisPayload('d1');
    expect(out).toMatchObject({
      dishId: 'd1',
      dishName: 'Борщ',
      totalGrams: 250,
    });
    expect(out.ingredients).toEqual([
      { name: 'свёкла', grams: 250, details: 'печёная' },
    ]);
  });

  it('handles dish with no ingredients (empty payload, zero grams)', async () => {
    await db.dishes.add({ id: 'd-empty', name: 'Пустое блюдо', created_at: ISO });
    const out = await buildDishAnalysisPayload('d-empty');
    expect(out.dishName).toBe('Пустое блюдо');
    expect(out.totalGrams).toBe(0);
    expect(out.ingredients).toEqual([]);
  });

  it('sums grams across multiple ingredients', async () => {
    await db.dishes.add({ id: 'd2', name: 'Микс', created_at: ISO });
    await db.products.bulkAdd([
      {
        id: 'p1',
        name: 'A',
        source: '',
        nutrients: {},
        portions: [],
        categories: [],
        serving_basis: '100g',
        serving_unit: null,
        created_at: ISO,
      },
      {
        id: 'p2',
        name: 'B',
        source: '',
        nutrients: {},
        portions: [],
        categories: [],
        serving_basis: '100g',
        serving_unit: null,
        created_at: ISO,
      },
    ]);
    await db.dish_items.bulkAdd([
      {
        id: 'di-a',
        dish_id: 'd2',
        product_id: 'p1',
        quantity: 100,
        details: '',
        created_at: ISO,
      },
      {
        id: 'di-b',
        dish_id: 'd2',
        product_id: 'p2',
        quantity: 75,
        details: '',
        created_at: ISO,
      },
    ]);

    const out = await buildDishAnalysisPayload('d2');
    expect(out.totalGrams).toBe(175);
    expect(out.ingredients).toHaveLength(2);
  });

  it('uses "?" when product is missing from Dexie and catalog', async () => {
    await db.dishes.add({ id: 'd-x', name: 'X', created_at: ISO });
    await db.dish_items.add({
      id: 'di-x',
      dish_id: 'd-x',
      product_id: 'unknown-id-not-in-catalog',
      quantity: 50,
      details: '',
      created_at: ISO,
    });
    const out = await buildDishAnalysisPayload('d-x');
    expect(out.ingredients[0].name).toBe('?');
  });

  it('falls back to empty dishName when dish row is missing', async () => {
    const out = await buildDishAnalysisPayload('does-not-exist');
    expect(out.dishName).toBe('');
    expect(out.totalGrams).toBe(0);
  });
});

// ── billing surface: 402 → PaymentRequiredError + idempotency header ──────────
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

describe('requestDishAnalysis — billing surface', () => {
  const payload: DishAnalysisPayload = {
    dishId: 'd',
    dishName: 'Борщ',
    totalGrams: 0,
    ingredients: [],
  };

  beforeEach(() => mockFetch.mockReset());

  it('throws PaymentRequiredError on 402 (carries need/have)', async () => {
    mockFetch.mockResolvedValue(jsonRes(402, { needKop: 200, haveKop: 0 }));
    const err = await requestDishAnalysis({ payload }).catch((e) => e);
    expect(err).toBeInstanceOf(PaymentRequiredError);
    expect(err.message).toBe('Недостаточно средств — пополните баланс');
    expect(err.needKop).toBe(200);
  });

  it('sends an X-Request-Id header on the POST', async () => {
    mockFetch.mockResolvedValue(jsonRes(402, {}));
    await requestDishAnalysis({ payload }).catch(() => {});
    const headers = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toMatch(UUID_RE);
  });

  it('returns the structured {summary, insights} on success', async () => {
    mockFetch.mockResolvedValue(
      jsonRes(200, {
        analysis: {
          summary: 'Сытно и сбалансированно.',
          insights: [
            {
              title: 'Железо + витамин C',
              detail: 'Свёкла и зелень — лучше усвоение.',
              valence: 'positive',
              strength: 'moderate',
              evidence: { days: [], foods: ['свёкла', 'зелень'] },
            },
          ],
          hypotheses: [],
        },
      }),
    );
    const out = await requestDishAnalysis({ payload });
    expect(out.summary).toBe('Сытно и сбалансированно.');
    expect(out.insights).toHaveLength(1);
    expect(out.insights[0]).toMatchObject({
      title: 'Железо + витамин C',
      valence: 'positive',
    });
  });
});

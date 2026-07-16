import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { db } from '@/shared/lib/dexie/schema';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';
import {
  collectFoods,
  collectNutrientsByDay,
  formatDishNameWithDetails,
  startAnalysis,
} from '../runAnalysis';

const ISO = '2026-05-13T10:00:00.000Z';

async function clearDb() {
  await Promise.all([
    db.products.clear(),
    db.dishes.clear(),
    db.dish_items.clear(),
    db.dish_portions.clear(),
    db.schedule_foods.clear(),
  ]);
}

beforeEach(async () => {
  await clearDb();
});

afterEach(async () => {
  await clearDb();
});

// Pure formatter — covers the bracket-tag composition independent of Dexie.
describe('formatDishNameWithDetails', () => {
  it('returns dish name unchanged when ingredient list is empty', () => {
    expect(formatDishNameWithDetails('Борщ', [])).toBe('Борщ');
  });

  it('returns dish name unchanged when every ingredient has empty details', () => {
    expect(
      formatDishNameWithDetails('Борщ', [
        { productName: 'свёкла', details: '' },
        { productName: 'говядина', details: '   ' },
      ]),
    ).toBe('Борщ');
  });

  it('joins productName + details with comma into [особенности: …]', () => {
    expect(
      formatDishNameWithDetails('Борщ', [
        { productName: 'свёкла', details: 'печёная' },
        { productName: 'говядина', details: 'тушёная 2ч' },
      ]),
    ).toBe('Борщ [особенности: свёкла печёная, говядина тушёная 2ч]');
  });

  it('falls back to details only when productName is unknown', () => {
    expect(
      formatDishNameWithDetails('Борщ', [
        { productName: '', details: 'без зажарки' },
      ]),
    ).toBe('Борщ [особенности: без зажарки]');
  });

  it('skips ingredients whose details are blank', () => {
    expect(
      formatDishNameWithDetails('Борщ', [
        { productName: 'свёкла', details: 'печёная' },
        { productName: 'лук', details: '' },
        { productName: 'морковь', details: 'тёртая' },
      ]),
    ).toBe('Борщ [особенности: свёкла печёная, морковь тёртая]');
  });
});

// Integration: real fake-indexeddb, real Dexie, real collectFoods.
describe('collectFoods — bracket-tag for dish details', () => {
  const dayKey = '13-05-2026';

  it('appends [особенности: …] when dish_items have non-empty details', async () => {
    await db.products.bulkAdd([
      {
        id: 'p-svekla',
        name: 'свёкла',
        source: '',
        nutrients: {},
        portions: [],
        categories: [],
        serving_basis: '100g',
        serving_unit: null,
        description: '',
        created_at: ISO,
        updated_at: ISO,
      },
      {
        id: 'p-meat',
        name: 'говядина',
        source: '',
        nutrients: {},
        portions: [],
        categories: [],
        serving_basis: '100g',
        serving_unit: null,
        description: '',
        created_at: ISO,
        updated_at: ISO,
      },
    ]);
    await db.dishes.add({
      id: 'd-borsch',
      name: 'Борщ',
      description: '',
      created_at: ISO,
      updated_at: ISO,
    });
    await db.dish_items.bulkAdd([
      {
        id: 'di1',
        dish_id: 'd-borsch',
        product_id: 'p-svekla',
        quantity: 200,
        details: 'печёная',
        created_at: ISO,
        updated_at: ISO,
      },
      {
        id: 'di2',
        dish_id: 'd-borsch',
        product_id: 'p-meat',
        quantity: 150,
        details: 'тушёная 2ч',
        created_at: ISO,
        updated_at: ISO,
      },
    ]);
    await db.schedule_foods.add({
      id: 'sf1',
      date: dayKey,
      time: '13:00',
      type: 'dish',
      quantity: 300,
      details: '',
      product_id: null,
      dish_id: 'd-borsch',
      created_at: ISO,
      updated_at: ISO,
    });

    const out = await collectFoods([dayKey]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      date: dayKey,
      time: '13:00',
      type: 'dish',
      quantity: 300,
      details: '',
      name: 'Борщ [особенности: свёкла печёная, говядина тушёная 2ч]',
    });
  });

  it('payload is unchanged when dish has no item details', async () => {
    await db.products.add({
      id: 'p-svekla',
      name: 'свёкла',
      source: '',
      nutrients: {},
      portions: [],
      categories: [],
      serving_basis: '100g',
      serving_unit: null,
      description: '',
      created_at: ISO,
      updated_at: ISO,
    });
    await db.dishes.add({
      id: 'd-borsch',
      name: 'Борщ',
      description: '',
      created_at: ISO,
      updated_at: ISO,
    });
    await db.dish_items.add({
      id: 'di1',
      dish_id: 'd-borsch',
      product_id: 'p-svekla',
      quantity: 200,
      details: '',
      created_at: ISO,
      updated_at: ISO,
    });
    await db.schedule_foods.add({
      id: 'sf1',
      date: dayKey,
      time: '13:00',
      type: 'dish',
      quantity: 300,
      details: '',
      product_id: null,
      dish_id: 'd-borsch',
      created_at: ISO,
      updated_at: ISO,
    });

    const out = await collectFoods([dayKey]);
    expect(out[0].name).toBe('Борщ');
  });

  it('product-typed schedule_food keeps the product name as-is', async () => {
    await db.products.add({
      id: 'p-apple',
      name: 'яблоко',
      source: '',
      nutrients: {},
      portions: [],
      categories: [],
      serving_basis: '100g',
      serving_unit: null,
      description: '',
      created_at: ISO,
      updated_at: ISO,
    });
    await db.schedule_foods.add({
      id: 'sf-apple',
      date: dayKey,
      time: '09:00',
      type: 'food',
      quantity: 150,
      details: 'свежее',
      product_id: 'p-apple',
      dish_id: null,
      created_at: ISO,
      updated_at: ISO,
    });

    const out = await collectFoods([dayKey]);
    expect(out[0].name).toBe('яблоко');
    expect(out[0].details).toBe('свежее');
  });
});

// Integration: per-day nutrient anchor — scaled by quantity, named in RU, with
// the daily-norm anchor attached. Mirrors useScheduleNutrientTotals but outside
// React.
describe('collectNutrientsByDay — per-day anchor', () => {
  const dayKey = '13-05-2026';

  it('scales a product by quantity/100 and labels nutrients in RU + norm', async () => {
    await db.products.add({
      id: 'p-chicken',
      name: 'курица',
      source: '',
      // protein id '1' = 20 g/100g, energy id '7' = 165 kcal/100g
      nutrients: { '1': 20, '7': 165 },
      portions: [],
      categories: [],
      serving_basis: '100g',
      serving_unit: null,
      description: '',
      created_at: ISO,
      updated_at: ISO,
    });
    await db.schedule_foods.add({
      id: 'sf-chicken',
      date: dayKey,
      time: '13:00',
      type: 'food',
      quantity: 200,
      details: '',
      product_id: 'p-chicken',
      dish_id: null,
      created_at: ISO,
      updated_at: ISO,
    });

    const out = await collectNutrientsByDay([dayKey]);
    expect(out).toHaveLength(1);
    expect(out[0].date).toBe(dayKey);
    const byName = new Map(out[0].nutrients.map((n) => [n.name, n]));
    // 20 g/100g × 200g = 40 g protein, norm anchor 51.
    expect(byName.get('Белки')).toEqual({
      name: 'Белки',
      amount: 40,
      unit: 'г',
      norm: 51,
    });
    // 165 × 2 = 330 kcal, norm anchor 2000.
    expect(byName.get('Энергия')).toEqual({
      name: 'Энергия',
      amount: 330,
      unit: 'ккал',
      norm: 2000,
    });
  });

  it('returns no entry for a day with no scheduled food', async () => {
    const out = await collectNutrientsByDay([dayKey]);
    expect(out).toEqual([]);
  });
});

// ── billing surface: 402 → PaymentRequiredError; idempotency rides on body.id ──
const mockFetch = vi.mocked(authedFetch);

function jsonRes(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}

describe('startAnalysis — billing surface', () => {
  // Empty dayKeys → the collectors short-circuit, so this exercises just the
  // request shape + 402 handling without touching Dexie/catalog.
  const args = { windowStart: '2026-05-01', windowEnd: '2026-05-07', dayKeys: [] };

  beforeEach(() => mockFetch.mockReset());

  it('throws PaymentRequiredError on 402 (carries need/have)', async () => {
    mockFetch.mockResolvedValue(jsonRes(402, { needKop: 500, haveKop: 0 }));
    const err = await startAnalysis(args).catch((e) => e);
    expect(err).toBeInstanceOf(PaymentRequiredError);
    expect(err.message).toBe('Недостаточно средств — пополните баланс');
    expect(err.needKop).toBe(500);
  });

  it('keys idempotency by the body `id` (long analysis sends no X-Request-Id header)', async () => {
    mockFetch.mockResolvedValue(jsonRes(402, {}));
    await startAnalysis(args).catch(() => {});
    const init = mockFetch.mock.calls[0]?.[1];
    const headers = init?.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toBeUndefined();
    const body = JSON.parse(String(init?.body));
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  // Fix #5: a caller retrying the SAME logical analysis passes the failed
  // attempt's id via `requestId`; the body id (== the idempotency key) reuses it
  // so the server dedups the row + 5 ₽ charge instead of creating a second one.
  it('reuses a caller-supplied requestId as the body `id`', async () => {
    mockFetch.mockResolvedValue(jsonRes(402, {}));
    await startAnalysis({ ...args, requestId: 'reused-analysis-id' }).catch(() => {});
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body.id).toBe('reused-analysis-id');
  });
});

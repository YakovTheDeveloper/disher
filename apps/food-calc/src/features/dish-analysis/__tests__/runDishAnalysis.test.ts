import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { buildDishAnalysisPayload, __testing } from '../api/runDishAnalysis';

const { parseSSELines } = __testing;
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

describe('parseSSELines', () => {
  it('accumulates content from delta tokens', () => {
    const chunks: string[] = [];
    const result = parseSSELines(
      [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        'data: {"choices":[{"delta":{"content":" world"}}]}',
      ],
      (c) => chunks.push(c),
    );
    expect(result).toEqual({ done: false, error: null });
    expect(chunks).toEqual(['Hello', ' world']);
  });

  it('signals done on [DONE]', () => {
    const result = parseSSELines(
      [
        'data: {"choices":[{"delta":{"content":"ok"}}]}',
        'data: [DONE]',
      ],
      () => {},
    );
    expect(result).toEqual({ done: true, error: null });
  });

  it('surfaces server error event with message', () => {
    const result = parseSSELines(
      [
        'event: error',
        'data: "OpenRouter 500: boom"',
      ],
      () => {},
    );
    expect(result.done).toBe(true);
    expect(result.error).toBe('OpenRouter 500: boom');
  });

  it('skips malformed JSON lines without throwing', () => {
    const chunks: string[] = [];
    const result = parseSSELines(
      [
        'data: not-json',
        'data: {"choices":[{"delta":{"content":"ok"}}]}',
      ],
      (c) => chunks.push(c),
    );
    expect(result).toEqual({ done: false, error: null });
    expect(chunks).toEqual(['ok']);
  });

  it('ignores lines without data: prefix', () => {
    const chunks: string[] = [];
    parseSSELines([': heartbeat', '', 'whatever'], (c) => chunks.push(c));
    expect(chunks).toEqual([]);
  });
});

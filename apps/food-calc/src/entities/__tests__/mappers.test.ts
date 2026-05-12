import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mapProductRow } from '@/entities/product/api/mappers';
import {
  mapDishRow,
  mapDishItemRow,
  mapDishPortionRow,
} from '@/entities/dish/api/mappers';
import { mapScheduleFoodRow } from '@/entities/schedule-food/api/mappers';
import { mapScheduleEventRow } from '@/entities/schedule-event/api/mappers';
import { readNormItems } from '@/entities/daily-norm/api/mappers';
import { mapHypothesisRow } from '@/entities/hypothesis/api/mappers';
import type { HypothesisRow } from '@/shared/lib/dexie/schema';

// Mappers convert Dexie rows (snake_case, sync-stripped) to UI types
// (camelCase). We test:
//   - field renaming
//   - jsonb stable (re)stringify or parse
//   - documented null/undefined fallbacks

const ISO_A = '2026-04-30T10:00:00.000Z';

describe('mapProductRow', () => {
  it('renames every snake_case field to camelCase', () => {
    const row = {
      id: 'p1',
      name: 'tofu',
      source: 'src',
      nutrients: { kcal: 150 },
      portions: [{ l: 'cube', g: 100 }],
      categories: ['protein'],
      serving_basis: '100g' as const,
      serving_unit: null,
      created_at: ISO_A,
    };
    const ui = mapProductRow(row);
    expect(ui).toEqual({
      id: 'p1',
      name: 'tofu',
      source: 'src',
      nutrients: '{"kcal":150}',
      portions: '[{"l":"cube","g":100}]',
      categories: '["protein"]',
      servingBasis: '100g',
      servingUnit: null,
      createdAt: ISO_A,
    });
  });

  it('jsonb fields handle null gracefully via documented fallbacks', () => {
    const row = {
      id: 'p3',
      name: 'x',
      source: '',
      nutrients: null as unknown as Record<string, unknown>,
      portions: null as unknown as Array<Record<string, unknown>>,
      categories: null as unknown as unknown[],
      serving_basis: '100g' as const,
      serving_unit: null,
      created_at: ISO_A,
    };
    const ui = mapProductRow(row);
    expect(ui.nutrients).toBe('{}');
    expect(ui.portions).toBe('[]');
    expect(ui.categories).toBe('[]');
  });

  it('property: id passes through verbatim', () => {
    fc.assert(
      fc.property(fc.uuid(), (id) => {
        const row = {
          id,
          name: 'x',
          source: '',
          nutrients: {},
          portions: [],
          categories: [],
          serving_basis: '100g' as const,
          serving_unit: null,
          created_at: ISO_A,
        };
        return mapProductRow(row).id === id;
      }),
    );
  });
});

describe('mapDishRow + mapDishItemRow + mapDishPortionRow', () => {
  it('mapDishRow renames all fields', () => {
    const row = { id: 'd1', name: 'salad', created_at: ISO_A };
    expect(mapDishRow(row)).toEqual({
      id: 'd1',
      name: 'salad',
      createdAt: ISO_A,
    });
  });

  it('mapDishItemRow renames all fields including dish_id / product_id', () => {
    const row = {
      id: 'di1',
      dish_id: 'd1',
      product_id: 'p1',
      quantity: 50,
      created_at: ISO_A,
    };
    expect(mapDishItemRow(row)).toEqual({
      id: 'di1',
      dishId: 'd1',
      productId: 'p1',
      quantity: 50,
      createdAt: ISO_A,
    });
  });

  it('mapDishPortionRow renames every field', () => {
    const row = {
      id: 'dp1',
      dish_id: 'd1',
      label: 'small',
      grams: 120,
      created_at: ISO_A,
    };
    expect(mapDishPortionRow(row)).toEqual({
      id: 'dp1',
      dishId: 'd1',
      label: 'small',
      grams: 120,
      createdAt: ISO_A,
    });
  });
});

describe('mapScheduleFoodRow', () => {
  it('renames + tolerates null product_id/dish_id (food vs dish kind)', () => {
    const foodRow = {
      id: 'sf1',
      date: '01-01-2099',
      time: '10:00',
      type: 'food' as const,
      quantity: 100,
      details: 'note',
      product_id: 'p1',
      dish_id: null,
      created_at: ISO_A,
    };
    const dishRow = {
      ...foodRow,
      type: 'dish' as const,
      product_id: null,
      dish_id: 'd1',
    };
    const ui = mapScheduleFoodRow(foodRow);
    expect(ui).toEqual({
      id: 'sf1',
      date: '01-01-2099',
      time: '10:00',
      type: 'food',
      quantity: 100,
      details: 'note',
      productId: 'p1',
      dishId: null,
      createdAt: ISO_A,
    });
    const ui2 = mapScheduleFoodRow(dishRow);
    expect(ui2.productId).toBeNull();
    expect(ui2.dishId).toBe('d1');
  });

  it('details defaults to empty string when row has no details', () => {
    const row = {
      id: 'sf2',
      date: '01-01-2099',
      time: '10:00',
      type: 'food' as const,
      quantity: 50,
      details: undefined as unknown as string,
      product_id: 'p1',
      dish_id: null,
      created_at: ISO_A,
    };
    expect(mapScheduleFoodRow(row).details).toBe('');
  });
});

describe('mapScheduleEventRow', () => {
  it('parses atoms when stored as a JSON string (legacy migration path)', () => {
    const row = {
      id: 'se1',
      date: '01-01-2099',
      time: '10:00',
      end_time: '11:00',
      text: 'evt',
      atoms: JSON.stringify([{ kind: 'flag', name: 'x' }]),
      created_at: ISO_A,
    } as never;
    const ui = mapScheduleEventRow(row);
    expect(Array.isArray(ui.atoms)).toBe(true);
  });

  it('end_time and text default to empty string', () => {
    const row = {
      id: 'se3',
      date: '01-01-2099',
      time: '10:00',
      end_time: undefined as unknown as string,
      text: undefined as unknown as string,
      atoms: [],
      created_at: ISO_A,
    };
    const ui = mapScheduleEventRow(row);
    expect(ui.endTime).toBe('');
    expect(ui.text).toBe('');
  });

  it('returns [] when atoms is malformed JSON', () => {
    const row = {
      id: 'se4',
      date: '01-01-2099',
      time: '10:00',
      end_time: '',
      text: '',
      atoms: 'not valid json' as unknown as unknown[],
      created_at: ISO_A,
    };
    expect(mapScheduleEventRow(row).atoms).toEqual([]);
  });
});

describe('readNormItems', () => {
  it('returns the items object as-is when stored as a parsed object', () => {
    const row = {
      id: 'dn1',
      name: 'goal',
      description: 'd',
      items: { protein: 80 } as unknown as Record<string, unknown>,
      created_at: ISO_A,
    };
    expect(readNormItems(row)).toEqual({ protein: 80 });
  });

  it('parses items when stored as a JSON string (legacy / snapshot path)', () => {
    const row = {
      id: 'dn3',
      name: 'g',
      description: '',
      items: '{"protein":80}' as unknown as Record<string, unknown>,
      created_at: ISO_A,
    };
    expect(readNormItems(row)).toEqual({ protein: 80 });
  });

  it('defaults to {} when row is missing / items is null', () => {
    expect(readNormItems(undefined)).toEqual({});
    const row = {
      id: 'dn2',
      name: 'g',
      description: '',
      items: null as unknown as Record<string, unknown>,
      created_at: ISO_A,
    };
    expect(readNormItems(row)).toEqual({});
  });

  it('returns {} on malformed JSON string', () => {
    const row = {
      id: 'dn4',
      name: 'g',
      description: '',
      items: 'not valid json' as unknown as Record<string, unknown>,
      created_at: ISO_A,
    };
    expect(readNormItems(row)).toEqual({});
  });
});

describe('mapHypothesisRow', () => {
  it('renames every field, preserves null markers for saved-but-not-testing', () => {
    const row: HypothesisRow = {
      id: 'h1',
      title: 'без молочки',
      body: 'тестируем неделю',
      days: 7,
      source_analysis_id: 'a1',
      saved_at: ISO_A,
      started_at: null,
      ended_at: null,
      outcome: null,
      note: null,
      created_at: ISO_A,
    };
    expect(mapHypothesisRow(row)).toEqual({
      id: 'h1',
      title: 'без молочки',
      body: 'тестируем неделю',
      days: 7,
      sourceAnalysisId: 'a1',
      savedAt: ISO_A,
      startedAt: null,
      endedAt: null,
      outcome: null,
      note: null,
      createdAt: ISO_A,
    });
  });

  it('coerces non-finite days to null', () => {
    const row: HypothesisRow = {
      id: 'h3',
      title: 'x',
      body: '',
      days: NaN as unknown as number,
      source_analysis_id: null,
      saved_at: ISO_A,
      started_at: null,
      ended_at: null,
      outcome: null,
      note: null,
      created_at: ISO_A,
    };
    expect(mapHypothesisRow(row).days).toBeNull();
  });
});

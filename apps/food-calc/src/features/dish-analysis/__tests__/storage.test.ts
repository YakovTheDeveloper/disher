import { afterEach, describe, expect, it } from 'vitest';
import { clear } from 'idb-keyval';
import {
  getDishAnalysis,
  saveDishAnalysis,
  deleteDishAnalysis,
} from '../api/storage';

afterEach(() => clear());

describe('dish-analysis storage', () => {
  it('round-trips a dish-analysis through idb-keyval', async () => {
    const a = {
      dishId: 'd1',
      summary: 'Сбалансированное блюдо.',
      insights: [],
      createdAt: '2026-05-13T10:00:00.000Z',
    };
    await saveDishAnalysis(a);
    const got = await getDishAnalysis('d1');
    expect(got).toEqual(a);
  });

  it('returns null when no analysis is stored for a dish', async () => {
    const got = await getDishAnalysis('never-saved');
    expect(got).toBeNull();
  });

  it('keeps per-dish entries isolated', async () => {
    await saveDishAnalysis({
      dishId: 'd1',
      summary: 'one',
      insights: [],
      createdAt: '2026-05-13T10:00:00.000Z',
    });
    await saveDishAnalysis({
      dishId: 'd2',
      summary: 'two',
      insights: [],
      createdAt: '2026-05-13T11:00:00.000Z',
    });
    const a = await getDishAnalysis('d1');
    const b = await getDishAnalysis('d2');
    expect(a?.summary).toBe('one');
    expect(b?.summary).toBe('two');
  });

  it('migrates a legacy { resultMd } record to { summary, insights }', async () => {
    // A record written by the pre-structured streaming build.
    await saveDishAnalysis({
      dishId: 'd-old',
      // @ts-expect-error legacy shape on purpose
      resultMd: '## Профиль БЖУ\nХорошо',
      createdAt: '2026-05-13T10:00:00.000Z',
    });
    const got = await getDishAnalysis('d-old');
    expect(got).toEqual({
      dishId: 'd-old',
      summary: '## Профиль БЖУ\nХорошо',
      insights: [],
      createdAt: '2026-05-13T10:00:00.000Z',
    });
  });

  it('deleteDishAnalysis removes the entry', async () => {
    await saveDishAnalysis({
      dishId: 'd1',
      summary: 'x',
      insights: [],
      createdAt: '2026-05-13T10:00:00.000Z',
    });
    await deleteDishAnalysis('d1');
    expect(await getDishAnalysis('d1')).toBeNull();
  });
});

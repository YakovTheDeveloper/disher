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
      resultMd: '## Профиль БЖУ\nХорошо',
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
      resultMd: 'one',
      createdAt: '2026-05-13T10:00:00.000Z',
    });
    await saveDishAnalysis({
      dishId: 'd2',
      resultMd: 'two',
      createdAt: '2026-05-13T11:00:00.000Z',
    });
    const a = await getDishAnalysis('d1');
    const b = await getDishAnalysis('d2');
    expect(a?.resultMd).toBe('one');
    expect(b?.resultMd).toBe('two');
  });

  it('deleteDishAnalysis removes the entry', async () => {
    await saveDishAnalysis({
      dishId: 'd1',
      resultMd: 'x',
      createdAt: '2026-05-13T10:00:00.000Z',
    });
    await deleteDishAnalysis('d1');
    expect(await getDishAnalysis('d1')).toBeNull();
  });
});

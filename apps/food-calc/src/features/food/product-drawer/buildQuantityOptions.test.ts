import { describe, it, expect } from 'vitest';
import { buildQuantityOptions } from './buildQuantityOptions';

describe('buildQuantityOptions', () => {
  it('без порций даёт ровно [На 100 г, Своё значение]', () => {
    const opts = buildQuantityOptions([]);
    expect(opts.map((o) => o.value)).toEqual(['100g', 'custom']);
    expect(opts[0].grams).toBe(100);
    expect(opts[1].grams).toBeNull();
  });

  it('добавляет по пункту на каждую именованную порцию', () => {
    const opts = buildQuantityOptions([
      { label: 'Стакан', grams: 250 },
      { label: 'Ложка', grams: 15 },
    ]);
    expect(opts.map((o) => o.value)).toEqual(['100g', 'custom', 'portion:0', 'portion:1']);
    expect(opts[2]).toMatchObject({ grams: 250, label: 'Стакан · 250 г' });
    expect(opts[3]).toMatchObject({ grams: 15, label: 'Ложка · 15 г' });
  });

  it('дедуп: порция ровно 100 г заменяет отдельный «На 100 г»', () => {
    const opts = buildQuantityOptions([{ label: 'Порция', grams: 100 }]);
    expect(opts.map((o) => o.value)).toEqual(['custom', 'portion:0']);
    expect(opts.some((o) => o.value === '100g')).toBe(false);
    expect(opts.find((o) => o.value === 'portion:0')?.grams).toBe(100);
  });

  it('игнорирует порции с нулевым/отрицательным весом', () => {
    const opts = buildQuantityOptions([
      { label: 'Пустая', grams: 0 },
      { label: 'Стакан', grams: 250 },
    ]);
    expect(opts.map((o) => o.value)).toEqual(['100g', 'custom', 'portion:0']);
    expect(opts.find((o) => o.value === 'portion:0')?.grams).toBe(250);
  });
});

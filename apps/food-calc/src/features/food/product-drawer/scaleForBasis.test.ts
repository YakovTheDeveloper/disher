import { describe, it, expect } from 'vitest';
import { scaleForBasis } from './scaleForBasis';

describe('scaleForBasis', () => {
  it('еда (100g): делит количество на 100', () => {
    expect(scaleForBasis('100g', 100)).toBe(1);
    expect(scaleForBasis('100g', 250)).toBe(2.5);
    expect(scaleForBasis('100g', 0)).toBe(0);
  });

  it('добавка (serving): скейл = число доз, без деления на 100', () => {
    expect(scaleForBasis('serving', 1)).toBe(1);
    expect(scaleForBasis('serving', 2)).toBe(2);
    // Регрессия-страж: добавка на дефолтном количестве 1 показывает состав
    // на 1 единицу (×1), а НЕ /100 — иначе таблица обнулялась бы.
    expect(scaleForBasis('serving', 1)).not.toBe(0.01);
  });
});

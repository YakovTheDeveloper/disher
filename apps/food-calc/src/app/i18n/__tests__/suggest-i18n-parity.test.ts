import { describe, expect, it } from 'vitest';
import ru from '../locales/ru.json';
import en from '../locales/en.json';

// Парность i18n: набор ключей suggest.* обязан совпадать в ru и en — фича
// ru-first, en-локаль не должна ни отставать, ни тащить мёртвые ключи.
const flatten = (obj: unknown, prefix: string): string[] =>
  Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flatten(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

describe('i18n — парность ключей suggest.*', () => {
  it('ru.json и en.json содержат одинаковый набор ключей suggest.*', () => {
    expect(flatten(en.suggest, '')).toEqual(flatten(ru.suggest, ''));
  });
});

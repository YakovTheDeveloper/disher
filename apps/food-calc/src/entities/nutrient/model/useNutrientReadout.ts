import { useCallback } from 'react';
// Чужая сущность (`daily-norm`) тянется ТОЛЬКО через @x-public-API — один символ,
// связь явная.
import { useUserNormItems } from '@/entities/daily-norm/@x/nutrient';
import {
  nutrientById,
  defaultDailyNorms,
  nutrientsHaveDailyNorm,
} from '@/entities/nutrient/ui/NutrientGroup/constants';

/**
 * Готовый «ридаут» одного нутриента — сплав данных нормы (`daily-norm`) и
 * метаданных нутриента. Единственное место norm-glue: `getNorm` / `getPercentage`
 * / `hasRealNorm` / `isPlaceholderNorm`, что раньше жили в NutrientTable.
 */
export type NutrientReadout = {
  /** Содержание в еде (что вернул `getValue(id)`). */
  value: number;
  /** Суточная норма (юзерская, иначе дефолт/плейсхолдер). */
  norm: number;
  /** % нормы (целое, ≤ 999). */
  pct: number;
  /**
   * Показывать ли %/бар/цель. true ⇔ у юзера есть норма И у нутриента ЕСТЬ
   * официальная норма И она > 0 (иначе цель — выдуманное число).
   */
  hasNorm: boolean;
  /**
   * Норма — плейсхолдер (нет офиц. нормы И юзер её не задавал) ⇒ на витринах-
   * нормах («Моя норма») рисуем «—», не выдуманное число.
   */
  isPlaceholder: boolean;
  /** Юнит (г / мг / ккал). */
  unit: string;
};

/**
 * norm-glue-хук: `(getValue) → (id) → NutrientReadout`. Читает норму юзера
 * (`useUserNormItems`, через @x) один раз, возвращает чистую функцию-ридаут для
 * рядов. Ряд-примитивы (`NutrientMeterRow` / `NutrientRow`) остаются чисто
 * презентационными — числа приходят пропами.
 */
export function useNutrientReadout(
  getValue: (id: string) => number,
): (id: string) => NutrientReadout {
  const userItems = useUserNormItems();
  // `!= null` покрывает и null (нормы нет), и undefined (ещё грузится из IDB) —
  // пока грузится, %/бар не показываем, чтобы не мигнуть дефолтами.
  const hasNormRow = userItems != null;

  return useCallback(
    (id: string): NutrientReadout => {
      const nutrient = nutrientById[id];
      const numId = Number(id);
      const norm = userItems?.[id] ?? defaultDailyNorms[numId] ?? 0;
      const hasRealNorm = nutrientsHaveDailyNorm[numId] === true;
      const isPlaceholder = !hasRealNorm && userItems?.[id] == null;
      const value = getValue(id);
      const pct = norm ? Math.round(Math.min((value / norm) * 100, 999)) : 0;

      return {
        value,
        norm,
        pct,
        hasNorm: hasNormRow && hasRealNorm && norm > 0,
        isPlaceholder,
        unit: nutrient?.unitRu ?? '',
      };
    },
    [getValue, userItems, hasNormRow],
  );
}

/**
 * Целое ли значение юнита (г / ккал показываем округлённо, мг / мкг — с десятыми).
 * Общий формат-хелпер для ряда-меры / ряда-нормы.
 */
export const isIntegerUnit = (unit: string): boolean =>
  unit === 'г' || unit === 'ккал';

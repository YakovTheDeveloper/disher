import type { SelectOption } from '@/shared/ui/atoms/Select';

// Значения пунктов Select количества (для продукта-еды, basis '100g'):
//   '100g'        — базовая основа на 100 г
//   'custom'      — «Своё значение» → раскрывает числовой ввод граммов
//   `portion:<i>` — именованная порция продукта (по индексу в списке)
export type QuantityOptionValue = '100g' | 'custom' | `portion:${number}`;

export interface QuantityOption extends SelectOption {
  value: QuantityOptionValue;
  /** Граммы, на которые встаёт количество. `null` у 'custom' — вводит юзер. */
  grams: number | null;
}

/**
 * Собирает пункты Select количества из именованных порций продукта.
 * Порядок: «На 100 г» → «Своё значение» → по пункту на каждую порцию (grams>0).
 * Дедуп: если есть порция ровно 100 г — отдельный «На 100 г» НЕ добавляем
 * (порция уже даёт основу на 100 г). Нет порций → просто [100 г, Своё значение].
 */
export function buildQuantityOptions(
  portions: { label: string; grams: number }[],
): QuantityOption[] {
  const named = portions.filter((p) => p.grams > 0);
  const hasHundred = named.some((p) => p.grams === 100);

  const options: QuantityOption[] = [];
  if (!hasHundred) {
    options.push({ value: '100g', label: 'На 100 г', grams: 100 });
  }
  options.push({ value: 'custom', label: 'Своё значение', grams: null });
  named.forEach((p, i) => {
    options.push({
      value: `portion:${i}`,
      label: `${p.label} · ${p.grams} г`,
      grams: p.grams,
    });
  });
  return options;
}

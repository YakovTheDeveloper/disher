/**
 * Shared number formatting for display.
 *
 * The project historically let every component call `.toFixed(1)`/`.toFixed(2)`
 * directly, which renders a trailing zero on integers ("1.0" instead of "1").
 * These helpers round AND strip the trailing zero, so callers share one rule.
 *
 * Decimal separator stays the JS default dot — Ru-comma is out of scope
 * (money in BalanceSection is the only comma consumer).
 */

/**
 * Round to `maxDecimals` and strip trailing zeros: 1.0 → "1", 1.50 → "1.5".
 * `Number(x.toFixed(n))` drops the ".0"; `String()` renders without the tail.
 * Non-finite input (NaN/Infinity) renders an em-dash placeholder.
 */
export function formatAmount(value: number, maxDecimals = 1): string {
  if (!Number.isFinite(value)) return '—';
  return String(Number(value.toFixed(maxDecimals)));
}

/**
 * Adaptive "% of daily norm" — consolidates the former `formatNormPercent`
 * and the inline `getRoundedPercent` (they were identical).
 * tiny <1 → 2 decimals, <10 → 1 decimal, ≥10 → integer. Always trims the tail.
 * Returns the number-string WITHOUT the "%" suffix (the caller appends it).
 */
export function formatPercent(percent: number): string {
  if (percent > 0 && percent < 1) return formatAmount(percent, 2);
  if (percent < 10) return formatAmount(percent, 1);
  return String(Math.round(percent));
}

/**
 * Масса нутриента для витрин — доктрина «не обмануть нулём, не шуметь десятыми»
 * (2026-07-23, по мотивам инцидента «курага: 0 г · 1 %»). Пороги — из регуляторных
 * правил округления: ТР ТС 022/2011 (прил. 3: <0.5 г БЖУ обязаны писаться с
 * десятым знаком — «0,4», а не «0»), EU 1169/2011 Guidance (Table 3: след →
 * «<0.5 g» вместо ложного «0»), FDA 21 CFR 101.9 («less than X» между следом и
 * единицей). ЕДИНОЕ правило по ВЕЛИЧИНЕ значения внутри класса единицы (не
 * per-нутриент):
 *  - сырой 0 → «0» — единственный честный ноль (всякий след > 0 обязан быть виден);
 *  - след ниже рендера (<0.05 массы / <0.5 ккал) → «<0.1» / «<1» — регуляторная
 *    форма «<X» вместо обманчивого «0»;
 *  - [порог, 1) → 1 десятичный: здесь целое округление обнулило бы значение;
 *  - ≥ 1 → целое: десятые тут — шум, точный канал — «% нормы» рядом.
 * Суммы дня при этом не расходятся с витриной: они аккумулируются из сырых
 * значений, округление — только слой отображения.
 */
export function formatNutrientMass(value: number, unit: string): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  if (unit === 'ккал') {
    if (value < 0.5) return '<1';
    return String(Math.round(value));
  }
  // г / мг / мкг — один класс массы, пороги общие.
  if (value < 0.05) return '<0.1';
  if (value < 1) return formatAmount(value, 1);
  return String(Math.round(value));
}

/**
 * «% нормы» для витрин из СЫРОГО процента (`pctRaw`, до округления — FDA
 * §(d)(7)(ii) разрешает считать %DV from the actual amount):
 *  - ≤ 0 → «0» (нулевая строка в витринах (NutrientTotals) приглушается целиком —
 *    .rowEmpty — и показывает этот честный «0», слот больше не гасится);
 *  - (0, 0.5) → «<1»: след нормы виден следом, а не ложным «0» и не шумными
 *    десятыми процента (паттерн «<X» из FDA/EU);
 *  - ≥ 0.5 → целое (FDA %DV — до ближайшего целого).
 * Без суффикса «%» (его ставит NumeralMarker).
 */
export function formatPctDisplay(rawPct: number): string {
  if (!Number.isFinite(rawPct)) return '—';
  if (rawPct <= 0) return '0';
  if (rawPct < 0.5) return '<1';
  return String(Math.round(rawPct));
}

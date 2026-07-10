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

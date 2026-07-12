// Money is stored and transported as integer kopecks (1 ₽ = 100 коп) — the
// wallet invariant («никаких float в БД/API»). These are the ONLY two ₽↔коп
// boundaries the UI is allowed to cross, kept in one place so every wallet
// surface (BalanceSection, admin panel) formats and parses identically.

/** Integer kopecks → localized ₽ string (no currency symbol, up to 2 decimals). */
export const rub = (kop: number): string =>
  (kop / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

/**
 * ₽ (possibly fractional) → integer kopecks. The single ₽→коп conversion at the
 * UI boundary — `Math.round` keeps it an integer even for values like 1.5 ₽
 * (→ 150 коп) that a float multiply would otherwise leave as 149.99999…
 */
export const rubToKop = (rubValue: number): number => Math.round(rubValue * 100);

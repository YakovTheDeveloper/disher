// Russian plural for «инсайт»: 1 инсайт · 2 инсайта · 5 инсайтов. Mirrors
// pluralHypotheses — the Гипотезы/Инсайты page header count uses it.
export function pluralInsights(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'инсайт';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'инсайта';
  return 'инсайтов';
}

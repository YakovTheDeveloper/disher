// Russian plural for «гипотеза»: 1 гипотеза · 2 гипотезы · 5 гипотез.
// Extracted from AnalysisListItem so both the long-analysis row and the
// hypotheses-screen header count share one source of truth.
export function pluralHypotheses(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'гипотеза';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'гипотезы';
  return 'гипотез';
}

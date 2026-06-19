// Split out of FoodActionCard.tsx so that file stays component-only (a stray
// function export breaks React Fast Refresh → full reload).

// «% от суточной нормы» для выбранного нутриента: значение_на_100г / норма × 100.
// Норму считает SearchFood один раз (`richNutrientNorm`) и прокидывает числом —
// у нутриентов без нормы (сахар, B7, часть аминокислот) она undefined, процент
// не рисуется, остаётся абсолютное значение + единица.
export function formatNormPercent(percent: number): string {
  if (percent > 0 && percent < 1) return `${percent.toFixed(2)}%`;
  if (percent < 10) return `${percent.toFixed(1)}%`;
  return `${Math.round(percent)}%`;
}

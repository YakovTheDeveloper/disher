import { formatPercent } from '@/shared/lib/formatNumber';

// Split out of FoodActionCard.tsx so that file stays component-only (a stray
// function export breaks React Fast Refresh → full reload).

// «% от суточной нормы» для выбранного нутриента: значение_на_100г / норма × 100.
// Норму считает SearchFood один раз (`richNutrientNorm`) и прокидывает числом —
// у нутриентов без нормы (сахар, B7, часть аминокислот) она undefined, процент
// не рисуется, остаётся абсолютное значение + единица.
export function formatNormPercent(percent: number): string {
  return `${formatPercent(percent)}%`;
}

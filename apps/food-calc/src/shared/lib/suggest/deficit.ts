import type { NutrientTotals } from '../nutrients';

export interface Deficit {
  id: string;
  norm: number;
  consumed: number;
  deficit: number;
  /** deficit / norm — относительный дефицит, он же вес wᵢ в скоринге. */
  relDeficit: number;
}

// Якорь: зеркало `nutrientsHaveDailyNorm` (только id со значением true) из
// entities/nutrient/ui/NutrientGroup/constants/constants.ts. shared не может
// импортировать из entities (FSD, steiger), поэтому список продублирован —
// при изменении источника править оба места. Равенство множеств сторожит
// тест entities/nutrient/ui/NutrientGroup/constants/__tests__/normed-mirror.test.ts.
export const NORMED_NUTRIENT_IDS: ReadonlySet<string> = new Set([
  '1', // protein
  '2', // fats
  '3', // carbohydrates
  '4', // sugar
  '6', // fiber
  '7', // energy
  '8', // water
  '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', // minerals
  '20', '21', '22', '23', '24', '25', '26', '28', '29', '30', '31', '32', '33', // vitamins
  '40', '41', '42', '43', '44', '45', '47', '49', '51', // essential amino acids
]);

export const defaultHasDailyNorm = (id: string): boolean => NORMED_NUTRIENT_IDS.has(id);

/**
 * Дефициты дня по нутриентам с официальной нормой. Нутриенты без нормы
 * (starch, каротины, незаменимые-не-essential аминокислоты) отбрасываются,
 * norm <= 0 не участвует (деление на ноль). Нутриенты с deficit = 0
 * сохраняются в результате — в скоринге они дают только штраф за перебор.
 */
export function computeDeficits(
  totals: NutrientTotals,
  norms: Record<string, number>,
  hasDailyNorm: (id: string) => boolean = defaultHasDailyNorm,
): Deficit[] {
  const deficits: Deficit[] = [];

  for (const [id, norm] of Object.entries(norms)) {
    if (!hasDailyNorm(id) || !(norm > 0)) continue;
    const consumed = totals[id] ?? 0;
    const deficit = Math.max(norm - consumed, 0);
    deficits.push({ id, norm, consumed, deficit, relDeficit: deficit / norm });
  }

  return deficits;
}

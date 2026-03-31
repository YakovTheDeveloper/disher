/**
 * Pure functions for nutrient calculations.
 * Nutrients are stored per 100g, scaled by quantity/100.
 */

export interface NutrientEntry {
  nutrientId: string;
  quantity: number;
}

export type NutrientTotals = Record<string, number>;

/**
 * Calculate total nutrients for a product at a given quantity.
 * Nutrients are stored per 100g, so we scale by quantity/100.
 */
export function calculateProductNutrients(
  nutrients: NutrientEntry[],
  quantity: number,
): NutrientTotals {
  const totals: NutrientTotals = {};
  const scale = quantity / 100;

  for (const n of nutrients) {
    totals[n.nutrientId] = (totals[n.nutrientId] ?? 0) + n.quantity * scale;
  }

  return totals;
}

/**
 * Calculate total nutrients for a dish.
 * A dish has items, each with a foodId (product) and quantity.
 * If userQuantity is provided, scale proportionally to baseDishWeight.
 */
export function calculateDishNutrients(
  dishItems: Array<{ foodId: string; quantity: number }>,
  productNutrientsMap: Map<string, NutrientEntry[]>,
  userQuantity?: number,
): NutrientTotals {
  const totals: NutrientTotals = {};
  let baseDishWeight = 0;

  for (const item of dishItems) {
    baseDishWeight += item.quantity;
    const nutrients = productNutrientsMap.get(item.foodId);
    if (!nutrients) continue;

    const itemTotals = calculateProductNutrients(nutrients, item.quantity);
    for (const [id, value] of Object.entries(itemTotals)) {
      totals[id] = (totals[id] ?? 0) + value;
    }
  }

  if (userQuantity !== undefined && baseDishWeight > 0) {
    const scale = userQuantity / baseDishWeight;
    for (const id of Object.keys(totals)) {
      totals[id] *= scale;
    }
  }

  return totals;
}

/**
 * Sum up nutrients from multiple sources (e.g. schedule items).
 */
export function sumNutrients(...totalsArray: NutrientTotals[]): NutrientTotals {
  const result: NutrientTotals = {};

  for (const totals of totalsArray) {
    for (const [id, value] of Object.entries(totals)) {
      result[id] = (result[id] ?? 0) + value;
    }
  }

  return result;
}

// Display-side helpers for ServingUnit. Source of truth for the unit string is
// `Product.servingUnit` (null = food, scalar measured in grams).

const FOOD_QTY_UNIT = 'г.';

type WithServingUnit = { servingUnit?: string | null } | null | undefined;

/** Label shown next to the schedule-food quantity. Defaults to grams. */
export function getQtyUnit(product: WithServingUnit): string {
  return product?.servingUnit ?? FOOD_QTY_UNIT;
}

/**
 * Pure functions for cost/price calculations.
 * All prices are stored normalised as pricePerKg (₽/kg).
 */

export function pricePerGram(pricePerKg: number): number {
  return pricePerKg / 1000;
}

export function pricePer100g(pricePerKg: number): number {
  return pricePerKg / 10;
}

export function costForWeight(pricePerKg: number, grams: number): number {
  return pricePerGram(pricePerKg) * grams;
}

/** Convert a user-entered price for a given weight to normalised ₽/kg. */
export function calculatePricePerKg(price: number, perGrams: number): number {
  return (price / perGrams) * 1000;
}

/** Convert normalised ₽/kg back to a price for a given weight (inverse of calculatePricePerKg). */
export function priceForWeight(pricePerKg: number, grams: number): number {
  return (pricePerKg / 1000) * grams;
}

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

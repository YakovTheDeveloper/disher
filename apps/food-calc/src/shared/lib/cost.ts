/**
 * Pure functions for cost/price calculations.
 */

export interface CostInfo {
  price: number;
  perGrams: number;
}

export function hasCost(cost: CostInfo): boolean {
  return cost.price > 0;
}

export function pricePerGram(cost: CostInfo): number {
  if (cost.perGrams <= 0) return 0;
  return cost.price / cost.perGrams;
}

export function pricePer100g(cost: CostInfo): number {
  return pricePerGram(cost) * 100;
}

export function pricePerKg(cost: CostInfo): number {
  return pricePerGram(cost) * 1000;
}

export function costForWeight(cost: CostInfo, grams: number): number {
  return pricePerGram(cost) * grams;
}

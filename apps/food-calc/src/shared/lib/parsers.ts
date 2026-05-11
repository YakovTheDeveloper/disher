import type { NutrientEntry } from './nutrients';

export type PortionEntry = { label: string; grams: number };

export function parseNutrients(json: string | null | undefined): NutrientEntry[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as Record<string, number>;
    return Object.entries(parsed).map(([nutrientId, quantity]) => ({ nutrientId, quantity }));
  } catch {
    return [];
  }
}

export function parsePortions(json: string | null | undefined): PortionEntry[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as PortionEntry[];
  } catch {
    return [];
  }
}

export function parseCategories(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

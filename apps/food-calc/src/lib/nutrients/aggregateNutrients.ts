import { sumRecordArray } from "@/lib/sumRecords/sumRecords";

type NutrientSource = { getTotalNutrients(): Record<string, number> };

/**
 * Aggregate nutrients from multiple sources and optionally scale to user quantity.
 *
 * @param sources - Array of entities implementing NutrientSource
 * @param userQuantity - Optional quantity to scale the final result to
 * @param baseWeight - Total base weight of all items (used for scaling)
 * @returns Aggregated and optionally scaled nutrient record
 */
export function aggregateNutrients(
    sources: NutrientSource[],
    userQuantity?: number,
    baseWeight?: number
): Record<string, number> {
    const nutrients = sources.map(source => source.getTotalNutrients());
    const acc = sumRecordArray(nutrients);

    // If userQuantity is provided and we have a baseWeight, scale the result
    if (userQuantity !== undefined && baseWeight && baseWeight > 0) {
        const scaleFactor = userQuantity / baseWeight;
        Object.keys(acc).forEach(key => {
            acc[key] = acc[key] * scaleFactor;
        });
    }

    return acc;
}

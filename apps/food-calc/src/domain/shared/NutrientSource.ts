/**
 * Common interface for entities that can provide nutrient calculations.
 * Implemented by Food and Dish models.
 */
export interface NutrientSource {
    /**
     * Calculate total nutrients for a given quantity.
     * @param quantity - The quantity to scale nutrients to (default: 100g)
     * @returns Record mapping nutrient IDs to their quantities
     */
    getTotalNutrients(quantity?: number): Record<string, number>;
}
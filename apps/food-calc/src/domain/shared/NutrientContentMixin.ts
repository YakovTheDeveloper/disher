import { getParent, types } from "mobx-state-tree";

/**
 * Common mixin for content types that delegate nutrient calculation to an entity.
 * Provides shared implementation of getTotalNutrients() and parentQuantity.
 * 
 * @param entityName - The name of the entity property ('food' or 'dish')
 * @returns MST composition with nutrient delegation logic
 */
export function NutrientContentMixin(entityName: 'food' | 'dish') {
    return types
        .model(`NutrientContentMixin_${entityName}`, {})
        .views(self => ({
            get parentQuantity(): number {
                return (getParent(self) as { quantity: number }).quantity;
            },
        }))
        .actions(self => ({
            getTotalNutrients(): Record<string, number> {
                const entity = (self as Record<string, unknown>)[entityName] as { getTotalNutrients?: (q: number) => Record<string, number> } | undefined;
                if (!entity) return {};

                if (typeof entity.getTotalNutrients === 'function') {
                    return entity.getTotalNutrients(self.parentQuantity);
                }

                return {};
            },
        }));
}
/**
 * Shared interfaces for Product and Dish detail pages.
 *
 * Both Product and Dish display essentially the same UI:
 *   - Name (display / editable)
 *   - Description (display / editable)
 *   - Quantity input (local state for scaling nutrient values)
 *   - Nutrient cards with filter/toggle
 *   - Portions (view / manage) -- future
 *
 * The key difference is **how nutrients are calculated**:
 *   - Product: nutrients stored directly on the entity, scaled linearly by quantity
 *   - Dish: nutrients aggregated from child items, scaled relative to baseDishWeight
 *
 * Both implement NutrientSource (getTotalNutrients), so TotalNutrientsStore works
 * with either transparently.
 */

/**
 * Minimal contract that both Food and Dish satisfy.
 * Used by the shared widget to render and interact with either entity type.
 */
export interface FoodEntityViewable {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Optional description text */
  description: string | undefined;

  /** Whether the entity is user-created (editable name/description/nutrients) */
  isEditable: boolean;

  /** Portions defined for this entity */
  portions: { label: string; amount: number; unit: string; grams: number }[];

  /** Calculate total nutrients for a given quantity (NutrientSource) */
  getTotalNutrients(quantity?: number): Record<string, number>;

  /** Change the entity name */
  changeName(name: string): void;

  /** Change the entity description */
  changeDescription(description: string | undefined): void;

  /** Add a portion */
  addPortion(portion: { label: string; amount: number; unit: string; grams: number }): void;

  /** Update an existing portion */
  updatePortion(label: string, updates: Partial<{ label: string; amount: number; unit: string; grams: number }>): void;

  /** Remove a portion */
  removePortion(label: string): void;
}

/**
 * Nutrient editing contract.
 * Only relevant for user-created entities where individual nutrient values
 * can be changed directly (e.g. custom products).
 */
export interface NutrientEditable {
  /** Get the raw (per-100g) value for a nutrient */
  getNutrientValue(nutrientId: string): number;

  /** Change a single nutrient value */
  changeNutrientValue(nutrientId: string, value: number): void;
}

/**
 * Adapter to create a FoodEntityViewable from a Food MST instance.
 */
export function foodToViewable(food: {
  id: string;
  name: string;
  description: string | undefined;
  createdByUser: boolean;
  portions: { label: string; amount: number; unit: string; grams: number }[];
  getTotalNutrients(quantity?: number): Record<string, number>;
  changeName(name: string): void;
  changeDescription(description: string | undefined): void;
  addPortion(portion: { label: string; amount: number; unit: string; grams: number }): void;
  updatePortion(label: string, updates: Partial<{ label: string; amount: number; unit: string; grams: number }>): void;
  removePortion(label: string): void;
}): FoodEntityViewable {
  return {
    id: food.id,
    name: food.name,
    description: food.description,
    isEditable: food.createdByUser,
    portions: food.portions,
    getTotalNutrients: (q) => food.getTotalNutrients(q),
    changeName: (n) => food.changeName(n),
    changeDescription: (d) => food.changeDescription(d),
    addPortion: (p) => food.addPortion(p),
    updatePortion: (l, u) => food.updatePortion(l, u),
    removePortion: (l) => food.removePortion(l),
  };
}

/**
 * Adapter to create a FoodEntityViewable from a Dish MST instance.
 */
export function dishToViewable(dish: {
  id: string;
  name: string;
  description: string;
  portions: { label: string; amount: number; unit: string; grams: number }[];
  getTotalNutrients(quantity: number): Record<string, number>;
  changeName(name: string): void;
  changeDescription(description: string): void;
  addPortion(portion: { label: string; amount: number; unit: string; grams: number }): void;
  updatePortion(label: string, updates: Partial<{ label: string; amount: number; unit: string; grams: number }>): void;
  removePortion(label: string): void;
}): FoodEntityViewable {
  return {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    isEditable: true, // dishes are always user-owned
    portions: dish.portions,
    getTotalNutrients: (q) => dish.getTotalNutrients(q ?? 100),
    changeName: (n) => dish.changeName(n),
    changeDescription: (d) => dish.changeDescription(d ?? ''),
    addPortion: (p) => dish.addPortion(p),
    updatePortion: (l, u) => dish.updatePortion(l, u),
    removePortion: (l) => dish.removePortion(l),
  };
}

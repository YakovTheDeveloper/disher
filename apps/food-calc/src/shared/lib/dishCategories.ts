import type { Product } from '@/entities/product';
import type { DishCategoryValue } from '@/entities/dish/model/categories';

// Sets of product category values that violate each dietary restriction
const MEAT_CATS = new Set(['meat', 'poultry']);
const FISH_CATS = new Set(['fish', 'seafood']);
const ANIMAL_CATS = new Set(['meat', 'poultry', 'fish', 'seafood', 'dairy', 'egg']);
const GLUTEN_CATS = new Set(['grain', 'cereal', 'bakery']);
const DAIRY_CATS = new Set(['dairy']);

type DishItemLike = { foodId: string };
type DishLike = { items?: Map<string, DishItemLike> | DishItemLike[] | null };

/**
 * Derives dietary category tags for a dish from its ingredients' product categories.
 * A dish receives a tag only if NO ingredient violates the corresponding restriction.
 * Returns an empty set for dishes with no items or no matching product data.
 */
export function computeDishDietaryCategories(
  dish: DishLike,
  productsById: Map<string, Product>
): Set<DishCategoryValue> {
  if (!dish.items) return new Set();

  const rawItems = dish.items instanceof Map
    ? Array.from(dish.items.values())
    : (dish.items as DishItemLike[]);

  if (rawItems.length === 0) return new Set();

  const itemCategories: string[][] = [];
  for (const item of rawItems) {
    const product = productsById.get(item.foodId);
    if (!product?.categories) continue;
    itemCategories.push(Array.from(product.categories));
  }

  if (itemCategories.length === 0) return new Set();

  const violates = (restricted: Set<string>) =>
    itemCategories.some((cats) => cats.some((c) => restricted.has(c)));

  const result = new Set<DishCategoryValue>();

  if (!violates(MEAT_CATS) && !violates(FISH_CATS)) result.add('vegetarian');
  if (!violates(ANIMAL_CATS)) result.add('vegan');
  if (!violates(MEAT_CATS)) result.add('pescatarian');
  if (!violates(GLUTEN_CATS)) result.add('gluten-free');
  if (!violates(DAIRY_CATS)) result.add('dairy-free');

  // Nutrient-based tags (high-protein, low-calorie, low-carb) can be added
  // here later using calculateDishNutrients()

  return result;
}

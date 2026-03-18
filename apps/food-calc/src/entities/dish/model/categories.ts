export type DishCategoryValue =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "keto"
  | "low-carb"
  | "gluten-free"
  | "dairy-free"
  | "paleo"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "dessert"
  | "italian"
  | "asian"
  | "mexican"
  | "mediterranean"
  | "indian"
  | "american"
  | "quick"
  | "meal-prep"
  | "slow-cooker"
  | "one-pot"
  | "no-cook"
  | "high-protein"
  | "low-calorie"
  | "high-fiber"
  | "heart-healthy"
  | "energy-boosting"
  | "summer"
  | "winter"
  | "holiday"
  | "comfort-food"
  | "light-meal";

export interface DishCategoryGroup {
  groupName: string;
  categories: DishCategoryValue[];
  icon?: string;
  description?: string;
}

export const DISH_CATEGORY_GROUPS: DishCategoryGroup[] = [
  {
    groupName: "Dietary Preferences",
    categories: ["vegetarian", "vegan", "pescatarian", "keto", "low-carb", "gluten-free", "dairy-free", "paleo"],
  },
  {
    groupName: "Meal Times",
    categories: ["breakfast", "lunch", "dinner", "snack", "dessert"],
  },
  {
    groupName: "World Cuisines",
    categories: ["italian", "asian", "mexican", "mediterranean", "indian", "american"],
  },
  {
    groupName: "Preparation Methods",
    categories: ["quick", "meal-prep", "slow-cooker", "one-pot", "no-cook"],
  },
  {
    groupName: "Nutritional Focus",
    categories: ["high-protein", "low-calorie", "high-fiber", "heart-healthy", "energy-boosting"],
  },
  {
    groupName: "Seasonality & Occasion",
    categories: ["summer", "winter", "holiday", "comfort-food", "light-meal"],
  },
];

export const DEFAULT_DISH_CATEGORY_POPULARITY: Record<DishCategoryValue, number> = {
  vegetarian: 7,
  vegan: 5,
  pescatarian: 4,
  keto: 6,
  "low-carb": 8,
  "gluten-free": 5,
  "dairy-free": 4,
  paleo: 3,
  breakfast: 9,
  lunch: 8,
  dinner: 9,
  snack: 7,
  dessert: 6,
  italian: 8,
  asian: 7,
  mexican: 6,
  mediterranean: 7,
  indian: 5,
  american: 6,
  quick: 9,
  "meal-prep": 7,
  "slow-cooker": 4,
  "one-pot": 6,
  "no-cook": 5,
  "high-protein": 8,
  "low-calorie": 7,
  "high-fiber": 6,
  "heart-healthy": 5,
  "energy-boosting": 6,
  summer: 5,
  winter: 5,
  holiday: 4,
  "comfort-food": 7,
  "light-meal": 6,
};

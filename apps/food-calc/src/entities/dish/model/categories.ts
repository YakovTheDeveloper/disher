// Dish categories are derived from ingredients — not stored in schema.
// Each category is auto-computed from product categories and/or nutrient data.
// See shared/lib/dishCategories.ts for the computation logic.

export type DishCategoryValue =
  // Derivable from product ingredient categories
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "gluten-free"
  | "dairy-free"
  // Derivable from nutrient calculations
  | "high-protein"
  | "low-calorie"
  | "low-carb";

export interface DishCategoryGroup {
  groupName: string;
  categories: DishCategoryValue[];
  icon?: string;
  description?: string;
}

export const DISH_CATEGORY_GROUPS: DishCategoryGroup[] = [
  {
    groupName: "Диета",
    categories: ["vegetarian", "vegan", "pescatarian", "gluten-free", "dairy-free"],
  },
  {
    groupName: "Питательность",
    categories: ["high-protein", "low-calorie", "low-carb"],
  },
];

import type { CategoryGroup, CategoryOption } from '@/shared/ui/FilterPanel/FilterPanel';

export const DISH_CATEGORY_LABELS: Record<DishCategoryValue, string> = {
    'vegetarian': 'Вегетарианское',
    'vegan': 'Веганское',
    'pescatarian': 'Пескатарианское',
    'gluten-free': 'Без глютена',
    'dairy-free': 'Без молочного',
    'high-protein': 'Высокий белок',
    'low-calorie': 'Низкокалорийное',
    'low-carb': 'Низкоуглеводное',
};

export function getDishCategoryGroups(): CategoryGroup<DishCategoryValue>[] {
    return DISH_CATEGORY_GROUPS.map(group => ({
        groupName: group.groupName,
        categories: group.categories as DishCategoryValue[],
        icon: group.icon,
    }));
}

export function getDishCategoryOptions(): Record<DishCategoryValue, CategoryOption<DishCategoryValue>> {
    const options: Record<string, CategoryOption<DishCategoryValue>> = {};
    for (const [value, label] of Object.entries(DISH_CATEGORY_LABELS)) {
        options[value] = { value: value as DishCategoryValue, label };
    }
    return options as Record<DishCategoryValue, CategoryOption<DishCategoryValue>>;
}

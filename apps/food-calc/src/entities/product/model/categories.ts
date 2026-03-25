export type ProductCategoryValue =
  | "vegetable"
  | "fruit"
  | "grain"
  | "legume"
  | "nut"
  | "seed"
  | "meat"
  | "poultry"
  | "fish"
  | "seafood"
  | "dairy"
  | "egg"
  | "oil"
  | "condiment"
  | "spice"
  | "herb"
  | "beverage"
  | "juice"
  | "tea"
  | "coffee"
  | "alcohol"
  | "processed"
  | "snack"
  | "dessert"
  | "bakery"
  | "cereal"
  | "vegan"
  | "vegetarian"
  | "gluten-free"
  | "dairy-free"
  | "low-carb"
  | "high-protein"
  | "supplement"
  | "other";

export interface ProductCategoryGroup {
  groupName: string;
  categories: ProductCategoryValue[];
  icon?: string;
  description?: string;
}

export const PRODUCT_CATEGORY_GROUPS: ProductCategoryGroup[] = [
  {
    groupName: "Овощи и фрукты",
    categories: ["vegetable", "fruit"],
  },
  {
    groupName: "Белковые продукты",
    categories: ["meat", "poultry", "fish", "seafood", "egg", "legume"],
  },
  {
    groupName: "Молочные продукты",
    categories: ["dairy"],
  },
  {
    groupName: "Крупы и выпечка",
    categories: ["grain", "cereal", "bakery"],
  },
  {
    groupName: "Орехи, семена и масла",
    categories: ["nut", "seed", "oil"],
  },
  {
    groupName: "Напитки",
    categories: ["beverage", "juice", "tea", "coffee", "alcohol"],
  },
  {
    groupName: "Специи и приправы",
    categories: ["condiment", "spice", "herb"],
  },
  {
    groupName: "Обработанные и перекусы",
    categories: ["processed", "snack", "dessert"],
  },
  {
    groupName: "Диетические",
    categories: ["vegan", "vegetarian", "gluten-free", "dairy-free", "low-carb", "high-protein"],
  },
  {
    groupName: "Прочее",
    categories: ["supplement", "other"],
  },
];

import type { CategoryGroup, CategoryOption } from '@/shared/ui/FilterPanel/FilterPanel';

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryValue, string> = {
    'vegetable': 'Овощи',
    'fruit': 'Фрукты',
    'grain': 'Крупы',
    'legume': 'Бобовые',
    'nut': 'Орехи',
    'seed': 'Семена',
    'meat': 'Мясо',
    'poultry': 'Птица',
    'fish': 'Рыба',
    'seafood': 'Морепродукты',
    'dairy': 'Молочные продукты',
    'egg': 'Яйца',
    'oil': 'Масла',
    'condiment': 'Соус',
    'spice': 'Специи',
    'herb': 'Травы',
    'beverage': 'Напитки',
    'juice': 'Сок',
    'tea': 'Чай',
    'coffee': 'Кофе',
    'alcohol': 'Алкоголь',
    'processed': 'Обработанные',
    'snack': 'Перекус',
    'dessert': 'Десерт',
    'bakery': 'Выпечка',
    'cereal': 'Каши',
    'vegan': 'Веганское',
    'vegetarian': 'Вегетарианское',
    'gluten-free': 'Без глютена',
    'dairy-free': 'Без молочных продуктов',
    'low-carb': 'Низкоуглеводное',
    'high-protein': 'Высокий белок',
    'supplement': 'Добавка',
    'other': 'Другое',
};

export function getProductCategoryGroups(): CategoryGroup<ProductCategoryValue>[] {
    return PRODUCT_CATEGORY_GROUPS.map(group => ({
        groupName: group.groupName,
        categories: group.categories as ProductCategoryValue[],
        icon: group.icon,
    }));
}

export function getProductCategoryOptions(): Record<ProductCategoryValue, CategoryOption<ProductCategoryValue>> {
    const options: Record<string, CategoryOption<ProductCategoryValue>> = {};
    for (const [value, label] of Object.entries(PRODUCT_CATEGORY_LABELS)) {
        options[value] = { value: value as ProductCategoryValue, label };
    }
    return options as Record<ProductCategoryValue, CategoryOption<ProductCategoryValue>>;
}

export const DEFAULT_PRODUCT_CATEGORY_POPULARITY: Record<ProductCategoryValue, number> = {
  vegetable: 9,
  fruit: 8,
  herb: 5,
  meat: 7,
  poultry: 7,
  fish: 6,
  seafood: 5,
  egg: 8,
  legume: 6,
  nut: 6,
  seed: 5,
  dairy: 8,
  vegan: 4,
  "dairy-free": 4,
  grain: 7,
  cereal: 6,
  bakery: 7,
  "gluten-free": 5,
  oil: 6,
  beverage: 7,
  juice: 5,
  tea: 6,
  coffee: 7,
  alcohol: 4,
  condiment: 6,
  spice: 5,
  processed: 5,
  snack: 7,
  dessert: 6,
  vegetarian: 5,
  "low-carb": 6,
  "high-protein": 7,
  supplement: 3,
  other: 5,
};

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
    groupName: "Fresh Produce",
    categories: ["vegetable", "fruit", "herb"],
  },
  {
    groupName: "Protein Sources",
    categories: ["meat", "poultry", "fish", "seafood", "egg", "legume", "nut", "seed"],
  },
  {
    groupName: "Dairy & Alternatives",
    categories: ["dairy", "vegan", "dairy-free"],
  },
  {
    groupName: "Grains & Cereals",
    categories: ["grain", "cereal", "bakery", "gluten-free"],
  },
  {
    groupName: "Fats & Oils",
    categories: ["oil", "nut", "seed"],
  },
  {
    groupName: "Beverages",
    categories: ["beverage", "juice", "tea", "coffee", "alcohol"],
  },
  {
    groupName: "Flavorings",
    categories: ["condiment", "spice", "herb"],
  },
  {
    groupName: "Processed & Snacks",
    categories: ["processed", "snack", "dessert"],
  },
  {
    groupName: "Dietary Categories",
    categories: ["vegan", "vegetarian", "gluten-free", "dairy-free", "low-carb", "high-protein"],
  },
  {
    groupName: "Other",
    categories: ["supplement", "other"],
  },
];

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

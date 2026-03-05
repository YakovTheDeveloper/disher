export type ProductCategoryValue =
    // Food groups
    | 'vegetable'
    | 'fruit'
    | 'grain'
    | 'legume'
    | 'nut'
    | 'seed'
    | 'meat'
    | 'poultry'
    | 'fish'
    | 'seafood'
    | 'dairy'
    | 'egg'
    | 'oil'
    | 'condiment'
    | 'spice'
    | 'herb'
    // Beverages
    | 'beverage'
    | 'juice'
    | 'tea'
    | 'coffee'
    | 'alcohol'
    // Processed foods
    | 'processed'
    | 'snack'
    | 'dessert'
    | 'bakery'
    | 'cereal'
    // Dietary categories
    | 'vegan'
    | 'vegetarian'
    | 'gluten-free'
    | 'dairy-free'
    | 'low-carb'
    | 'high-protein'
    // Miscellaneous
    | 'supplement'
    | 'other';

export type ProductCategory = {
    value: ProductCategoryValue;
    popularity: number; // 1-10 scale
    icon?: string; // Optional icon name for UI
    color?: string; // Optional color code for UI
    description?: string; // Short description for tooltips
    isActive?: boolean; // Whether this category is currently selected/filtered
    createdAt?: Date; // When this category was created
    updatedAt?: Date; // When this category was last updated
    userDefined?: boolean; // Whether this is a user-defined category
    parentCategory?: ProductCategoryValue; // For hierarchical categories
    tags?: string[]; // Additional tags for more granular filtering
}[];

// Helper types for filtering and UI
export type ProductCategoryFilter = {
    category: ProductCategoryValue;
    isSelected: boolean;
    sortOrder: number; // For custom ordering in UI
};

export type ProductCategoryGroup = {
    groupName: string;
    categories: ProductCategoryValue[];
    icon?: string;
    description?: string;
};

// Predefined category groups for better organization
export const PRODUCT_CATEGORY_GROUPS: ProductCategoryGroup[] = [
    {
        groupName: 'Fresh Produce',
        categories: ['vegetable', 'fruit', 'herb'],
        icon: 'produce',
        description: 'Fresh fruits, vegetables, and herbs'
    },
    {
        groupName: 'Protein Sources',
        categories: ['meat', 'poultry', 'fish', 'seafood', 'egg', 'legume', 'nut', 'seed'],
        icon: 'protein',
        description: 'Animal and plant-based protein sources'
    },
    {
        groupName: 'Dairy & Alternatives',
        categories: ['dairy', 'vegan', 'dairy-free'],
        icon: 'dairy',
        description: 'Milk, cheese, yogurt and dairy alternatives'
    },
    {
        groupName: 'Grains & Cereals',
        categories: ['grain', 'cereal', 'bakery', 'gluten-free'],
        icon: 'grain',
        description: 'Breads, cereals, rice, pasta, and grains'
    },
    {
        groupName: 'Fats & Oils',
        categories: ['oil', 'nut', 'seed'],
        icon: 'oil',
        description: 'Cooking oils, nuts, seeds, and fat sources'
    },
    {
        groupName: 'Beverages',
        categories: ['beverage', 'juice', 'tea', 'coffee', 'alcohol'],
        icon: 'beverage',
        description: 'Drinks and beverages'
    },
    {
        groupName: 'Flavorings',
        categories: ['condiment', 'spice', 'herb'],
        icon: 'flavor',
        description: 'Sauces, spices, and flavor enhancers'
    },
    {
        groupName: 'Processed & Snacks',
        categories: ['processed', 'snack', 'dessert'],
        icon: 'snack',
        description: 'Packaged foods, snacks, and desserts'
    },
    {
        groupName: 'Dietary Categories',
        categories: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'low-carb', 'high-protein'],
        icon: 'diet',
        description: 'Dietary-specific categories'
    },
    {
        groupName: 'Other',
        categories: ['supplement', 'other'],
        icon: 'other',
        description: 'Supplements and miscellaneous items'
    }
];

// Default popularity scores (can be adjusted based on user behavior analytics)
export const DEFAULT_PRODUCT_CATEGORY_POPULARITY: Record<ProductCategoryValue, number> = {
    // Fresh Produce
    'vegetable': 9,
    'fruit': 8,
    'herb': 5,
    // Protein Sources
    'meat': 7,
    'poultry': 7,
    'fish': 6,
    'seafood': 5,
    'egg': 8,
    'legume': 6,
    'nut': 6,
    'seed': 5,
    // Dairy & Alternatives
    'dairy': 8,
    'vegan': 4,
    'dairy-free': 4,
    // Grains & Cereals
    'grain': 7,
    'cereal': 6,
    'bakery': 7,
    'gluten-free': 5,
    // Fats & Oils
    'oil': 6,
    // Beverages
    'beverage': 7,
    'juice': 5,
    'tea': 6,
    'coffee': 7,
    'alcohol': 4,
    // Flavorings
    'condiment': 6,
    'spice': 5,
    // Processed & Snacks
    'processed': 5,
    'snack': 7,
    'dessert': 6,
    // Dietary Categories
    'vegetarian': 5,
    'low-carb': 6,
    'high-protein': 7,
    // Other
    'supplement': 3,
    'other': 5
};

// Utility function to create a product category array with default values
export function createProductCategories(
    values: ProductCategoryValue[],
    customPopularity?: Partial<Record<ProductCategoryValue, number>>
): ProductCategory {
    return values.map(value => ({
        value,
        popularity: customPopularity?.[value] ?? DEFAULT_PRODUCT_CATEGORY_POPULARITY[value] ?? 5,
        isActive: false,
        userDefined: false,
        createdAt: new Date(),
        updatedAt: new Date()
    }));
}

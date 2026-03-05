export type DishCategoryValue =
    // Dietary preferences
    | 'vegetarian'
    | 'vegan'
    | 'pescatarian'
    | 'keto'
    | 'low-carb'
    | 'gluten-free'
    | 'dairy-free'
    | 'paleo'
    // Meal times
    | 'breakfast'
    | 'lunch'
    | 'dinner'
    | 'snack'
    | 'dessert'
    // Cuisine types
    | 'italian'
    | 'asian'
    | 'mexican'
    | 'mediterranean'
    | 'indian'
    | 'american'
    // Preparation methods
    | 'quick'
    | 'meal-prep'
    | 'slow-cooker'
    | 'one-pot'
    | 'no-cook'
    // Nutritional focus
    | 'high-protein'
    | 'low-calorie'
    | 'high-fiber'
    | 'heart-healthy'
    | 'energy-boosting'
    // Seasonal/occasion
    | 'summer'
    | 'winter'
    | 'holiday'
    | 'comfort-food'
    | 'light-meal';

export type DishCategory = {
    value: DishCategoryValue;
    popularity: number; // 1-10 scale
    icon?: string; // Optional icon name for UI
    color?: string; // Optional color code for UI
    description?: string; // Short description for tooltips
    isActive?: boolean; // Whether this category is currently selected/filtered
    createdAt?: Date; // When this category was created
    updatedAt?: Date; // When this category was last updated
    userDefined?: boolean; // Whether this is a user-defined category
    parentCategory?: DishCategoryValue; // For hierarchical categories
    tags?: string[]; // Additional tags for more granular filtering
}[];

// Helper types for filtering and UI
export type DishCategoryFilter = {
    category: DishCategoryValue;
    isSelected: boolean;
    sortOrder: number; // For custom ordering in UI
};

export type DishCategoryGroup = {
    groupName: string;
    categories: DishCategoryValue[];
    icon?: string;
    description?: string;
};

// Predefined category groups for better organization
export const DISH_CATEGORY_GROUPS: DishCategoryGroup[] = [
    {
        groupName: 'Dietary Preferences',
        categories: ['vegetarian', 'vegan', 'pescatarian', 'keto', 'low-carb', 'gluten-free', 'dairy-free', 'paleo'],
        icon: 'diet',
        description: 'Categories based on dietary restrictions and preferences'
    },
    {
        groupName: 'Meal Times',
        categories: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
        icon: 'clock',
        description: 'Categories based on time of day'
    },
    {
        groupName: 'World Cuisines',
        categories: ['italian', 'asian', 'mexican', 'mediterranean', 'indian', 'american'],
        icon: 'globe',
        description: 'Types of world cuisines'
    },
    {
        groupName: 'Preparation Methods',
        categories: ['quick', 'meal-prep', 'slow-cooker', 'one-pot', 'no-cook'],
        icon: 'cooking',
        description: 'Based on complexity and cooking time'
    },
    {
        groupName: 'Nutritional Focus',
        categories: ['high-protein', 'low-calorie', 'high-fiber', 'heart-healthy', 'energy-boosting'],
        icon: 'nutrition',
        description: 'Based on nutritional properties'
    },
    {
        groupName: 'Seasonality & Occasion',
        categories: ['summer', 'winter', 'holiday', 'comfort-food', 'light-meal'],
        icon: 'calendar',
        description: 'Seasonal and special occasion dishes'
    }
];

// Default popularity scores (can be adjusted based on user behavior analytics)
export const DEFAULT_CATEGORY_POPULARITY: Record<DishCategoryValue, number> = {
    // Dietary preferences
    'vegetarian': 7,
    'vegan': 5,
    'pescatarian': 4,
    'keto': 6,
    'low-carb': 8,
    'gluten-free': 5,
    'dairy-free': 4,
    'paleo': 3,
    // Meal times
    'breakfast': 9,
    'lunch': 8,
    'dinner': 9,
    'snack': 7,
    'dessert': 6,
    // Cuisine types
    'italian': 8,
    'asian': 7,
    'mexican': 6,
    'mediterranean': 7,
    'indian': 5,
    'american': 6,
    // Preparation methods
    'quick': 9,
    'meal-prep': 7,
    'slow-cooker': 4,
    'one-pot': 6,
    'no-cook': 5,
    // Nutritional focus
    'high-protein': 8,
    'low-calorie': 7,
    'high-fiber': 6,
    'heart-healthy': 5,
    'energy-boosting': 6,
    // Seasonal/occasion
    'summer': 5,
    'winter': 5,
    'holiday': 4,
    'comfort-food': 7,
    'light-meal': 6
};

// Utility function to create a dish category array with default values
export function createDishCategories(
    values: DishCategoryValue[],
    customPopularity?: Partial<Record<DishCategoryValue, number>>
): DishCategory {
    return values.map(value => ({
        value,
        popularity: customPopularity?.[value] ?? DEFAULT_CATEGORY_POPULARITY[value] ?? 5,
        isActive: false,
        userDefined: false,
        createdAt: new Date(),
        updatedAt: new Date()
    }));
}
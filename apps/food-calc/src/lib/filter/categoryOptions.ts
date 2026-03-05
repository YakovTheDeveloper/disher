import {
    DISH_CATEGORY_GROUPS,
    DishCategoryValue
} from '@/domain/dish/Dish.types';
import {
    PRODUCT_CATEGORY_GROUPS,
    ProductCategoryValue
} from '@/domain/product/Product.types';
import { CategoryOption, CategoryGroup } from '@/components/ui/FilterPanel/FilterPanel';

// Common categories that exist in both Dish and Product
export const COMMON_CATEGORY_VALUES: string[] = [
    'vegan',
    'vegetarian',
    'gluten-free',
    'dairy-free',
    'low-carb',
    'high-protein',
    'snack',
    'dessert',
];

// Russian labels for Dish categories
export const DISH_CATEGORY_LABELS: Record<DishCategoryValue, string> = {
    // Dietary preferences
    'vegetarian': 'Вегетарианское',
    'vegan': 'Веганское',
    'pescatarian': 'Пескатарианское',
    'keto': 'Кето',
    'low-carb': 'Низкоуглеводное',
    'gluten-free': 'Без глютена',
    'dairy-free': 'Без молочных продуктов',
    'paleo': 'Палео',
    // Meal times
    'breakfast': 'Завтрак',
    'lunch': 'Обед',
    'dinner': 'Ужин',
    'snack': 'Перекус',
    'dessert': 'Десерт',
    // Cuisine types
    'italian': 'Итальянская',
    'asian': 'Азиатская',
    'mexican': 'Мексиканская',
    'mediterranean': 'Средиземноморская',
    'indian': 'Индийская',
    'american': 'Американская',
    // Preparation methods
    'quick': 'Быстрое',
    'meal-prep': 'На неделю',
    'slow-cooker': 'Мультиварка',
    'one-pot': 'Одно блюдо',
    'no-cook': 'Без готовки',
    // Nutritional focus
    'high-protein': 'Высокий белок',
    'low-calorie': 'Низкокалорийное',
    'high-fiber': 'Высокое содержание клетчатки',
    'heart-healthy': 'Для сердца',
    'energy-boosting': 'Энергетическое',
    // Seasonal/occasion
    'summer': 'Летнее',
    'winter': 'Зимнее',
    'holiday': 'Праздничное',
    'comfort-food': 'Комфортная еда',
    'light-meal': 'Легкое блюдо',
};

// Russian labels for Product categories
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryValue, string> = {
    // Food groups
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
    // Beverages
    'beverage': 'Напитки',
    'juice': 'Сок',
    'tea': 'Чай',
    'coffee': 'Кофе',
    'alcohol': 'Алкоголь',
    // Processed foods
    'processed': 'Обработанные',
    'snack': 'Перекус',
    'dessert': 'Десерт',
    'bakery': 'Выпечка',
    'cereal': 'Каши',
    // Dietary categories
    'vegan': 'Веганское',
    'vegetarian': 'Вегетарианское',
    'gluten-free': 'Без глютена',
    'dairy-free': 'Без молочных продуктов',
    'low-carb': 'Низкоуглеводное',
    'high-protein': 'Высокий белок',
    // Miscellaneous
    'supplement': 'Добавка',
    'other': 'Другое',
};

// Convert Dish category groups to FilterPanel format
export function getDishCategoryGroups(): CategoryGroup<DishCategoryValue>[] {
    return DISH_CATEGORY_GROUPS.map(group => ({
        groupName: group.groupName,
        categories: group.categories as DishCategoryValue[],
        icon: group.icon,
    }));
}

// Convert Product category groups to FilterPanel format
export function getProductCategoryGroups(): CategoryGroup<ProductCategoryValue>[] {
    return PRODUCT_CATEGORY_GROUPS.map(group => ({
        groupName: group.groupName,
        categories: group.categories as ProductCategoryValue[],
        icon: group.icon,
    }));
}

// Get category options for Dish
export function getDishCategoryOptions(): Record<DishCategoryValue, CategoryOption<DishCategoryValue>> {
    const options: Record<string, CategoryOption<DishCategoryValue>> = {};
    for (const [value, label] of Object.entries(DISH_CATEGORY_LABELS)) {
        options[value] = { value: value as DishCategoryValue, label };
    }
    return options as Record<DishCategoryValue, CategoryOption<DishCategoryValue>>;
}

// Get category options for Product
export function getProductCategoryOptions(): Record<ProductCategoryValue, CategoryOption<ProductCategoryValue>> {
    const options: Record<string, CategoryOption<ProductCategoryValue>> = {};
    for (const [value, label] of Object.entries(PRODUCT_CATEGORY_LABELS)) {
        options[value] = { value: value as ProductCategoryValue, label };
    }
    return options as Record<ProductCategoryValue, CategoryOption<ProductCategoryValue>>;
}
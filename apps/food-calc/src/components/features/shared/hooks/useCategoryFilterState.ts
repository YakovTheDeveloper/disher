import { useState, useCallback, useMemo } from 'react';
import { COMMON_CATEGORY_VALUES } from '@/lib/filter/categoryOptions';

type FilterType = 'product' | 'dish';

interface CategoryFilterState {
    product: string[];
    dish: string[];
}

/**
 * Hook for managing category filter state for both Product and Dish.
 * Common categories (vegan, vegetarian, etc.) are synchronized between types.
 */
export function useCategoryFilterState() {
    const [selectedCategories, setSelectedCategories] = useState<CategoryFilterState>({
        product: [],
        dish: [],
    });

    /**
     * Toggle a category for a specific filter type.
     * Common categories are synchronized between Product and Dish.
     */
    const toggleCategory = useCallback((type: FilterType, category: string) => {
        setSelectedCategories(prev => {
            const isCommon = COMMON_CATEGORY_VALUES.includes(category);
            const currentList = prev[type];
            const isSelected = currentList.includes(category);

            let newList: string[];
            if (isSelected) {
                newList = currentList.filter(c => c !== category);
            } else {
                newList = [...currentList, category];
            }

            // If it's a common category, sync it to the other type
            if (isCommon) {
                const otherType = type === 'product' ? 'dish' : 'product';
                const otherList = prev[otherType];
                const newOtherList = isSelected
                    ? otherList.filter(c => c !== category)
                    : [...otherList, category];

                return {
                    ...prev,
                    [type]: newList,
                    [otherType]: newOtherList,
                };
            }

            return {
                ...prev,
                [type]: newList,
            };
        });
    }, []);

    /**
     * Clear all categories for a specific type.
     * Common categories are also cleared from the other type.
     */
    const clearCategories = useCallback((type: FilterType) => {
        setSelectedCategories(prev => {
            const cleared = prev[type].filter(c => COMMON_CATEGORY_VALUES.includes(c));

            // Clear common categories from both types
            const otherType = type === 'product' ? 'dish' : 'product';
            const otherCleared = prev[otherType].filter(c => !cleared.includes(c));

            return {
                ...prev,
                [type]: [],
                [otherType]: otherCleared,
            };
        });
    }, []);

    /**
     * Clear all categories from both types
     */
    const clearAllCategories = useCallback(() => {
        setSelectedCategories({ product: [], dish: [] });
    }, []);

    /**
     * Get category filter array for a specific type (for fuzzySearch)
     */
    const getCategoryFilter = useCallback((type: FilterType): string[] => {
        return selectedCategories[type];
    }, [selectedCategories]);

    /**
     * Check if any categories are selected for a type
     */
    const hasSelection = useCallback((type: FilterType): boolean => {
        return selectedCategories[type].length > 0;
    }, [selectedCategories]);

    /**
     * Check if any categories are selected in either type
     */
    const hasAnySelection = useMemo(() => {
        return selectedCategories.product.length > 0 || selectedCategories.dish.length > 0;
    }, [selectedCategories]);

    return {
        selectedCategories,
        toggleCategory,
        clearCategories,
        clearAllCategories,
        getCategoryFilter,
        hasSelection,
        hasAnySelection,
    };
}

export type UseCategoryFilterStateReturn = ReturnType<typeof useCategoryFilterState>;
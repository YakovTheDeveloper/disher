import Fuse from 'fuse.js';

/**
 * Enhanced search utility using Fuse.js for efficient offline fuzzy search
 * Optimized for food/product catalogs with up to 5000+ items
 */

export interface SearchOptions<T = Record<string, unknown>> {
    /** Fields to search within each item */
    keys: (keyof T | string)[];
    /** Minimum search length before applying fuzzy search (defaults to 2) */
    minLength?: number;
    /** Maximum number of results to return (defaults to 20) */
    limit?: number;
    /** Fuzzy threshold 0.0-1.0, lower = more fuzzy (defaults to 0.4) */
    threshold?: number;
    /** Weight importance of keys (e.g., ['name:3', 'category:1']) */
    weights?: Record<string, number>;
    /** Category filter - items must have at least one of these categories */
    categoryFilter?: string[];
}

/**
 * Performs fuzzy search using Fuse.js with optimized settings for food/product data
 *
 * @param items Array of items to search
 * @param query Search query string
 * @param options Search configuration
 * @returns Array of matched items sorted by relevance score
 */
export function fuzzySearch<T extends Record<string, any>>(
    items: T[] | readonly T[],
    query: string,
    options: SearchOptions
): T[] {
    const { categoryFilter, minLength: configMinLength, limit: configLimit, ...searchOptions } = options;
    const trimmedQuery = query.trim();
    const minLength = configMinLength ?? 2;
    const limit = configLimit ?? 20;

    // Start with all items (or filtered by category if provided)
    let filteredItems: T[] = [...items];

    // Apply category filter first if provided
    if (categoryFilter && categoryFilter.length > 0) {
        const lowerCategories = categoryFilter.map(c => c.toLowerCase());
        filteredItems = filteredItems.filter(item => {
            const itemCategory = item.category?.toLowerCase();
            if (!itemCategory) return false;
            return lowerCategories.some(cat => itemCategory.includes(cat));
        });
    }

    // Return filtered items if no search query
    if (!trimmedQuery) {
        return filteredItems.slice(0, limit);
    }

    // Return all items if query is too short for fuzzy matching
    if (trimmedQuery.length < minLength) {
        // For short queries, use simple include check
        return fuzzySearchSimple(filteredItems, trimmedQuery, searchOptions.keys, limit);
    }

    // Fuse.js configuration for optimal performance and accuracy
    const fuseOptions: Fuse.IFuseOptions<T> = {
        keys: searchOptions.weights
            ? Object.entries(searchOptions.weights).map(([key, weight]) => ({ name: key, weight }))
            : searchOptions.keys,
        threshold: searchOptions.threshold ?? 0.4, // Reasonable balance of accuracy and fuzziness
        distance: searchOptions.keys.length > 1 ? 100 : 80, // Allow more distance for multiple keys
        includeScore: false, // We don't need scores in result
        includeMatches: false, // Keep results clean
        minMatchCharLength: minLength,
        ignoreLocation: false,
        findAllMatches: false,
        isCaseSensitive: false,
        ignoreFieldNorm: false,
        useExtendedSearch: false,
        tokenize: true,
        matchAllTokens: true,
    };

    const fuse = new Fuse(filteredItems, fuseOptions);
    const results = fuse.search(trimmedQuery);

    return results
        .slice(0, limit)
        .map(result => result.item);
}

/**
 * Simple substring search for very short queries
 * More predictable and faster than Fuse.js for 1-character searches
 */
function fuzzySearchSimple<T extends Record<string, any>>(
    items: T[] | readonly T[],
    query: string,
    keys: string[],
    limit: number
): T[] {
    const lowerQuery = query.toLowerCase();
    const results: T[] = [];

    for (const item of items) {
        if (results.length >= limit) break;

        for (const key of keys) {
            const value = item[key];
            if (value && String(value).toLowerCase().includes(lowerQuery)) {
                results.push(item);
                break; // Only add item once, even if multiple keys match
            }
        }
    }

    return results;
}

/**
 * Enhanced version of the existing filterBy function for backward compatibility
 * Maintains the same API but uses fuzzy search internally
 */
export function filterByWithSearch<T extends Record<string, any>>(
    items: T[] | readonly T[] | undefined,
    query: string,
    fields: string[]
): T[] {
    if (!items) return [];

    return fuzzySearch(
        items,
        query,
        {
            keys: fields,
            minLength: 1, // Start fuzzy search from 1 character
            threshold: 0.5, // Less fuzzy for better precision
            limit: items.length, // Return all results unlike fuzzySearch default
        }
    );
}

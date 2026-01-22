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
    const trimmedQuery = query.trim();

    // Return all items if query is too short for fuzzy matching
    const minLength = options.minLength ?? 2;
    if (trimmedQuery.length < minLength) {
        if (trimmedQuery.length === 0) {
            return [...items];
        }

        // For short queries, use simple include check
        return fuzzySearchSimple(items, trimmedQuery, options.keys, options.limit ?? 20);
    }

    // Fuse.js configuration for optimal performance and accuracy
    const fuseOptions: Fuse.IFuseOptions<T> = {
        keys: options.weights
            ? Object.entries(options.weights).map(([key, weight]) => ({ name: key, weight }))
            : options.keys,
        threshold: options.threshold ?? 0.4, // Reasonable balance of accuracy and fuzziness
        distance: options.keys.length > 1 ? 100 : 80, // Allow more distance for multiple keys
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

    const fuse = new Fuse(items, fuseOptions);
    const results = fuse.search(trimmedQuery);

    return results
        .slice(0, options.limit ?? 20)
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

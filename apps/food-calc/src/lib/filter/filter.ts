import { filterByWithSearch } from '../search';

export function filterBy<T extends Record<string, unknown>>(
    items: T[] | readonly T[] | undefined,
    query: string,
    fields: (keyof T | string)[]
): T[] {
    return filterByWithSearch(items, query, fields as string[]);
}

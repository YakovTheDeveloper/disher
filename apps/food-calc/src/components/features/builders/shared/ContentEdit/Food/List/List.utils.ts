import { ListItemBase } from './List.types';

/**
 * Merge local filtered items with remote items, removing duplicates by id
 */
export function mergeItems<T extends ListItemBase>(
    localItems: T[],
    remoteItems: T[]
): T[] {
    const localIds = new Set(localItems.map((item) => item.id));
    const uniqueRemoteItems = remoteItems.filter((item) => !localIds.has(item.id));
    return [...localItems, ...uniqueRemoteItems];
}

/**
 * Check if scroll is near bottom (within threshold)
 */
export function isNearBottom(
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number,
    threshold: number = 200
): boolean {
    return scrollHeight - scrollTop - clientHeight < threshold;
}

/**
 * Get initial empty response for type safety
 */
export function getEmptyResponse<T extends ListItemBase>(): {
    items: T[];
    hasMore: boolean;
} {
    return { items: [], hasMore: false };
}

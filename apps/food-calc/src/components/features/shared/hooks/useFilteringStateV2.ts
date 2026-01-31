import { useState, useMemo, useCallback } from 'react';
import { fuzzySearch, SearchOptions } from '@/lib/search';

export interface TabFilterConfig<T extends object = object> {
    readonly tabName: string;
    readonly list: readonly T[];
    readonly filterKeys: readonly (keyof T & string)[];
}

export interface FilteringOptions {
    minLength?: number;
    limit?: number;
    debounce?: number;
}

export function useFilteringStateV2(
    tabs: readonly TabFilterConfig<T>[],
    options: FilteringOptions = {}
) {
    const { minLength = 2, limit = 50 } = options;

    const [currentTab, setCurrentTab] = useState(tabs[0]?.tabName ?? '');
    const [searchQuery, setSearchQuery] = useState('');

    // Текущая конфигурация таба
    const currentConfig = useMemo(
        () => tabs.find(t => t.tabName === currentTab) ?? tabs[0],
        [tabs, currentTab]
    );

    // Отфильтрованный список
    const filteredList = useMemo(() => {
        if (!searchQuery.trim() || !currentConfig) {
            return currentConfig?.list ?? [];
        }

        const searchOptions: SearchOptions<Record<string, unknown>> = {
            keys: [...currentConfig.filterKeys],
            minLength,
            limit,
            threshold: 0.4,
        };

        return fuzzySearch(currentConfig.list, searchQuery, searchOptions);
    }, [searchQuery, currentConfig, minLength, limit]);

    return {
        currentTab,
        searchQuery,
        filteredList,
        setTab: useCallback((tab: string) => setCurrentTab(tab), []),
        setSearch: useCallback((query: string) => setSearchQuery(query), []),
        clearSearch: useCallback(() => setSearchQuery(''), []),
    };
}

export type UseFilteringStateV2Return<T = any> = {
    currentTab: string;
    searchQuery: string;
    filteredList: readonly T[];
    setTab: (tab: string) => void;
    setSearch: (query: string) => void;
    clearSearch: () => void;
};

export function createFilterKeys<T extends string>(
    common: T[],
    uniqueByTab: Record<string, T[]>
): Record<string, T[]> {
    const result: Record<string, T[]> = {};

    for (const [tabName, unique] of Object.entries(uniqueByTab)) {
        result[tabName] = [...common, ...unique];
    }

    return result;
}

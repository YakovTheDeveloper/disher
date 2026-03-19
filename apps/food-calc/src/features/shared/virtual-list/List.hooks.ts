import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import {
    ListItemBase,
    UseListDataOptions,
    UseListDataReturn,
    UseListVisibilityOptions,
    FetchResponse,
} from './List.types';
import { mergeItems } from './List.utils';

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_STALE_TIME_MS = 1000 * 60 * 5; // 5 minutes
const DEFAULT_LIMIT = 10;

/**
 * Hook for managing list data (local + remote merge, infinite query)
 */
export function useListData<T extends ListItemBase>({
    queryKey,
    onFetch,
    searchQuery,
    filteredLocal,
    isEnabled,
}: UseListDataOptions<T>): UseListDataReturn<T> {
    const queryClient = useQueryClient();

    const [debouncedSearch] = useDebounce(searchQuery, DEFAULT_DEBOUNCE_MS);

    const fetchPage = useCallback(
        async ({ pageParam = 1 }: { pageParam?: number }): Promise<FetchResponse<T>> => {
            const response = await onFetch({
                page: pageParam,
                limit: DEFAULT_LIMIT,
                filters: { search: debouncedSearch || undefined },
            });
            return response;
        },
        [onFetch, debouncedSearch]
    );

    const getNextPageParam = useCallback(
        (lastPage: FetchResponse<T>, allPages: FetchResponse<T>[]) => {
            return lastPage.hasMore ? allPages.length + 1 : undefined;
        },
        []
    );

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isPending,
    } = useInfiniteQuery({
        queryKey: [queryKey, debouncedSearch],
        queryFn: fetchPage,
        getNextPageParam,
        initialPageParam: 1,
        enabled: isEnabled && debouncedSearch.length > 0,
        refetchOnMount: false,
        staleTime: DEFAULT_STALE_TIME_MS,
    });

    const items = useMemo(() => {
        if (!debouncedSearch) return [...filteredLocal];
        const remoteItems = data?.pages.flatMap((page) => page.items) ?? [];
        return mergeItems([...filteredLocal], remoteItems);
    }, [data?.pages, filteredLocal, debouncedSearch]);

    const reset = useCallback(() => {
        queryClient.resetQueries({ queryKey: [queryKey, debouncedSearch] });
    }, [queryClient, queryKey, debouncedSearch]);

    return {
        items,
        isLoading: isLoading || isPending,
        isFetchingNextPage,
        hasNextPage: hasNextPage ?? false,
        fetchNextPage,
        reset,
    };
}

/**
 * Hook for handling visibility and close events
 */
export function useListVisibility({
    isShow,
    onClose,
    containerRef,
    triggerRef,
    closeOnOutsideClick,
    closeOnEscape,
    isEnabled,
}: UseListVisibilityOptions): void {
    // Handle click outside
    useEffect(() => {
        if (!isEnabled || !isShow || !closeOnOutsideClick) return;

        const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
            const target =
                event instanceof MouseEvent
                    ? event.target
                    : event.touches[0]?.target;

            if (!(target instanceof Node)) return;

            const clickedOutsideContainer =
                containerRef.current && !containerRef.current.contains(target);
            const clickedOutsideTrigger =
                !triggerRef?.current || !triggerRef.current.contains(target);

            if (clickedOutsideContainer && clickedOutsideTrigger) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, [isEnabled, isShow, closeOnOutsideClick, onClose, containerRef, triggerRef]);

    // Handle escape key
    useEffect(() => {
        if (!isEnabled || !isShow || !closeOnEscape) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEnabled, isShow, closeOnEscape, onClose]);

    // Handle focus leaving the list
    useEffect(() => {
        if (!isEnabled || !isShow) return;

        const handleFocusIn = (event: FocusEvent) => {
            const target = event.target as Node;
            const isInsideContainer =
                containerRef.current?.contains(target) ?? false;
            const isInsideTrigger =
                triggerRef?.current?.contains(target) ?? false;

            if (!isInsideContainer && !isInsideTrigger) {
                onClose();
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        return () => document.removeEventListener('focusin', handleFocusIn);
    }, [isEnabled, isShow, onClose, containerRef, triggerRef]);
}

/**
 * Hook for scroll handling with infinite load trigger
 */
export function useListScroll({
    parentRef,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
}: {
    parentRef: React.RefObject<HTMLElement>;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
}) {
    const isFetchingRef = useRef(isFetchingNextPage);
    isFetchingRef.current = isFetchingNextPage;

    const hasNextPageRef = useRef(hasNextPage);
    hasNextPageRef.current = hasNextPage;

    const handleScroll = useCallback(() => {
        const el = parentRef.current;
        if (!el || !hasNextPageRef.current || isFetchingRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        const threshold = 200;

        if (scrollHeight - scrollTop - clientHeight < threshold) {
            fetchNextPage();
        }

        // Hide keyboard on scroll - Yandex/Google mobile web best practice
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
            activeElement.blur();
        }
    }, [parentRef, fetchNextPage]);

    return handleScroll;
}

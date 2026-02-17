import { UseFilteringStateV2Return } from '@/components/features/shared/hooks/useFilteringStateV2';
import { ReactNode } from 'react';

export interface ListItemBase {
    id: string | number;
}

export interface FetchResponse<T extends ListItemBase = ListItemBase> {
    items: T[];
    hasMore: boolean;
}

export type FetchFn<T extends ListItemBase = ListItemBase> = (params: {
    page: number;
    limit: number;
    filters: { search?: string };
}) => Promise<FetchResponse<T>>;

export interface ListProps<T extends ListItemBase = ListItemBase> {
    /** Control visibility */
    isShow: boolean;
    /** Callback when list should close */
    onClose: () => void;
    /** Search state with query and filtered local items */
    search: UseFilteringStateV2Return<T>;
    /** React Query key */
    queryKey: string;
    /** Fetch function for remote data */
    onFetch: FetchFn<T>;
    /** Render function for list items */
    renderListContent: (item: T) => ReactNode;
    /** Content after list items */
    after?: ReactNode;
    /** Gap between items in px */
    gapSize?: number;
    /** Close list when item selected (clicked) */
    closeOnSelect?: boolean;
    /** Close on click outside container */
    closeOnOutsideClick?: boolean;
    /** Close on Escape key */
    closeOnEscape?: boolean;
    /** Additional className for container */
    className?: string;
}

export interface ListItemProps<T extends ListItemBase = ListItemBase> {
    virtualRow: {
        key: string | number;
        index: number;
        start: number;
        size: number;
    };
    item: T;
    renderListContent: (item: T) => ReactNode;
    onClick?: () => void;
}

export interface UseListVisibilityOptions {
    isShow: boolean;
    onClose: () => void;
    containerRef: React.RefObject<HTMLElement>;
    triggerRef?: React.RefObject<HTMLElement>;
    closeOnOutsideClick: boolean;
    closeOnEscape: boolean;
    isEnabled: boolean;
}

export interface UseListDataOptions<T extends ListItemBase> {
    queryKey: string;
    onFetch: FetchFn<T>;
    searchQuery: string;
    filteredLocal: T[];
    isEnabled: boolean;
}

export interface UseListDataReturn<T extends ListItemBase> {
    items: T[];
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    reset: () => void;
}

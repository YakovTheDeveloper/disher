import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

import styles from './List.module.scss';
import { ListProps, ListItemBase } from './List.types';
import { useListData, useListVisibility, useListScroll } from './List.hooks';
import { ListItem } from './ListItem';
import { Overlay } from '@/components/ui/Overlay';

const DEFAULT_GAP_SIZE = 8;
const DEFAULT_OVERSCAN = 5;
const ESTIMATED_ITEM_HEIGHT = 48;

/**
 * Virtualized searchable list with infinite scroll
 * Supports local + remote data merging
 */
function ListInner<T extends ListItemBase>({
  isShow,
  onClose = () => {},
  search,
  queryKey,
  onFetch,
  renderListContent,
  after,
  gapSize = DEFAULT_GAP_SIZE,
  closeOnSelect = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className,
}: ListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Data management
  const { items, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, reset } =
    useListData<T>({
      queryKey,
      onFetch,
      searchQuery: search.searchQuery,
      filteredLocal: search.filteredList,
      isEnabled: isShow,
    });

  // Visibility handling (outside click, escape, focus out)
  useListVisibility({
    isShow,
    onClose,
    containerRef,
    closeOnOutsideClick,
    closeOnEscape,
    isEnabled: isShow,
  });

  // Virtual list setup
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT + gapSize,
    overscan: DEFAULT_OVERSCAN,
  });

  // Scroll handler with infinite load trigger
  const handleScroll = useListScroll({
    parentRef: containerRef,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Reset and scroll to top when filter changes
  useEffect(() => {
    if (!isShow) return;

    // Scroll to top when search changes
    const timeout = setTimeout(() => {
      rowVirtualizer.scrollToIndex(0, { align: 'start' });
    }, 0);

    return () => clearTimeout(timeout);
  }, [search.searchQuery, isShow, rowVirtualizer]);

  // Reset when list is hidden
  useEffect(() => {
    if (!isShow) {
      reset();
    }
  }, [isShow, reset]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  // Handle item click with optional close
  const handleItemClick = useCallback(
    (item: T) => {
      return () => {
        if (closeOnSelect) {
          onClose();
        }
      };
    },
    [closeOnSelect, onClose]
  );

  const showInitialLoading = isLoading && items.length === 0;
  const showEmptyState = !isFetchingNextPage && !isLoading && virtualItems.length === 0;
  const showEndLoader = isFetchingNextPage || isLoading;

  // Don't render if not visible

  if (!isShow) return null;

  return (
    <div
      ref={containerRef}
      className={clsx(styles.scrollContainer, className)}
      onScroll={handleScroll}
      role="listbox"
      aria-expanded={isShow}
    >
      {/* <Overlay className="" isLoading={() => showInitialLoading} /> */}

      <ul
        className={styles.list}
        style={{
          height: totalHeight ? `${totalHeight}px` : 'auto',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          // Render loader placeholder for next page
          if (!item) return null;

          return (
            <ListItem<T>
              key={virtualRow.key}
              virtualRow={virtualRow}
              item={item}
              renderListContent={renderListContent}
              onClick={handleItemClick(item)}
            />
          );
        })}

        {showEmptyState && (
          <div className={styles.noResults}>
            <p>{search.searchQuery ? 'По вашему запросу ничего не найдено' : ''}</p>
          </div>
        )}

        {showEndLoader && (
          <li
            className={styles.listEndLoader}
            style={{
              transform: `translateY(${totalHeight - 60}px)`,
              position: 'absolute',
            }}
            aria-hidden="true"
          />
        )}

        {after}
      </ul>
    </div>
  );
}

// Observer wrapper with generic support
export const List = observer(ListInner) as <T extends ListItemBase>(
  props: ListProps<T>
) => JSX.Element | null;

export default List;

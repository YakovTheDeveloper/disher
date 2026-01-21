import { useRef, useMemo, memo } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './List.module.scss';
import { GetFoodParams } from '@/api/food/food.api';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { Overlay } from '@/components/ui/Overlay';

type Props = {
  search: {
    filterText: string;
    filteredList: any[];
  };
  after: React.ReactNode;
  queryKey: string;
  onFetch: (params: GetFoodParams) => Promise<{
    items: any[];
    hasMore: boolean;
  }>;
  renderListContent: (item: any) => React.ReactNode;
};

const ListItem = memo(
  ({
    virtualRow,
    item,
    renderListContent,
  }: {
    virtualRow: VirtualItem;
    item: any;
    renderListContent: (item: any) => React.ReactNode;
  }) => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {renderListContent(item)}
    </div>
  )
);
ListItem.displayName = 'ListItem';

const List = observer(({ search, onFetch, queryKey, renderListContent, after }: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredLocal = search.filteredList;

  type Response = { items: any[]; hasMore: boolean };

  const fetchFoodPage = async ({ pageParam = 1 }): Promise<Response> => {
    const res = await onFetch({
      page: pageParam,
      limit: 10,
      filters: { search: search.filterText || undefined },
    });
    return res as Response;
  };

  const getNextPageParam = (lastPage: Response, allPages: Response[]) => {
    return lastPage.hasMore ? allPages.length + 1 : undefined;
  };

  const [debouncedFilter] = useDebounce(search.filterText, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isQueryLoading,
  } = useInfiniteQuery({
    queryKey: [queryKey, debouncedFilter],
    queryFn: fetchFoodPage,
    getNextPageParam: getNextPageParam,
    initialPageParam: 1,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const items = useMemo(() => {
    const remoteItems = data?.pages.flatMap((p) => p.items) || [];
    const localIds = new Set(filteredLocal.map((i) => i.id));
    return [...filteredLocal, ...remoteItems.filter((i) => !localIds.has(i.id))];
  }, [data?.pages, filteredLocal]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  const handleScroll = () => {
    const el = parentRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      fetchNextPage();
    }
  };

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  const listHeight = totalHeight ? `${totalHeight}px` : 'auto';

  const initLoading = isQueryLoading && filteredLocal.length === 0;

  return (
    <div ref={parentRef} className={styles.scrollContainer} onScroll={handleScroll}>
      <Overlay className="" isLoading={() => initLoading} />
      <ul
        className={styles.list}
        style={{
          height: listHeight,
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) return null;

          return (
            <ListItem
              key={item.id}
              virtualRow={virtualRow}
              item={item}
              renderListContent={renderListContent}
            />
          );
        })}

        {!isFetchingNextPage && !isQueryLoading && virtualItems.length === 0 ? (
          <div>
            <p>По вашему запросу ничего не найдено</p>
          </div>
        ) : null}

        {(isFetchingNextPage || isQueryLoading) && (
          <li
            className={styles.listEndLoader}
            style={{
              transform: `translateY(${rowVirtualizer.getTotalSize() - 60}px)`,
            }}
          ></li>
        )}

        {after}
      </ul>
    </div>
  );
});

export default List;

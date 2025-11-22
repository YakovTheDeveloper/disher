import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import styles from './List.module.scss';
import { GetFoodParams } from '@/api/food/food.api';
import { ScheduleContentSearchItem } from '@/components/blocks/builders/food/ScheduleBuilder/model/SearchViewModel';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { FoodEntity } from '@/store/models/food/types';
import { Overlay } from '@/components/ui/Overlay';
import { domainStore } from '@/store/store';

type Props = {
  search: {
    filterSearchText: string;
    localFiltered: unknown[];
  };
  queryKey: string;
  onFetch: (params: GetFoodParams) => Promise<{
    items: {
      id: number;
      name: string;
    }[];
    hasMore: boolean;
  }>;
  renderListContent: (item: unknown) => React.ReactNode;
};

const List = observer(({ search, onFetch, queryKey, renderListContent }: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredLocal = search.localFiltered;

  type Response = { items: FoodEntity[]; hasMore: boolean };

  const fetchFoodPage = async ({ pageParam = 1 }): Promise<Response> => {
    const res = await onFetch({
      page: pageParam,
      limit: 10,
      filters: { search: search.filterSearchText || undefined },
    });
    return res;
  };

  console.log(domainStore.foodStore);

  const getNextPageParam = (lastPage: Response, allPages: Response[]) => {
    return lastPage.hasMore ? allPages.length + 1 : undefined;
  };

  const [debouncedFilter] = useDebounce(search.filterSearchText, 300);

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
    refetchOnMount: true,
    staleTime: Infinity,
  });

  const remoteItems = data?.pages.flatMap((p) => p.items) || [];

  const localIds = new Set(filteredLocal.map((i) => i.id));
  const items = [...filteredLocal, ...remoteItems.filter((i) => !localIds.has(i.id))];

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? items.length + 1 : items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
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

  // useEffect(() => {
  //   fetchNextPage();
  // }, []);

  const initLoading = isQueryLoading && filteredLocal.length === 0;

  return (
    <div ref={parentRef} className={styles.scrollContainer} onScroll={handleScroll}>
      <Overlay isLoading={() => initLoading} />
      <ul
        className={styles.list}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {/* <li
          className={styles.listEndLoader}
          style={{
            transform: `translateY(${rowVirtualizer.getTotalSize() - 60}px)`,
          }}
        ></li> */}
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) return null;

          return (
            <li
              key={item.id}
              className={clsx([
                styles.listItem,
                // vm.selectedItemId?.variant === item.type &&
                //   vm.selectedItemId?.id === item.id &&
                //   styles.listItem_active,
              ])}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderListContent(item)}
            </li>
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
      </ul>
    </div>
  );
});

export default List;

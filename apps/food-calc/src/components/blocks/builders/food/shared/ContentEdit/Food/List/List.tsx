import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import styles from './List.module.scss';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getFoodList } from '@/api/food/food.api';
import {
  ScheduleContentSearchItem,
  UICollectionItem,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/SearchViewModel';
import { CommonData } from '@/store/models/common/types';
import { FoodModelStore } from '@/store/models/food/foodModelStore';
import { foodStore } from '@/store/rootStore';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FoodEntity } from '@/store/models/food/types';
import { useDebounce } from 'use-debounce';

type Props = {
  content: {
    filtered: UICollectionItem[];
    filterText: string;
    setFilterText: (text: string) => void;
  };
  onFoodSelect: (item: ScheduleContentSearchItem) => void;
  vm: {
    selectedItemId?: {
      variant: string;
      id: number;
    };
  };
  model?: FoodModelStore;
};

const List = observer(({ onFoodSelect, content, vm, model = foodStore }: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredLocal = content.filtered;

  type Response = { items: FoodEntity[]; hasMore: boolean };

  const fetchFoodPage = async ({ pageParam = 1 }): Promise<Response> => {
    const res = await model.getFoodWithParams({
      page: pageParam,
      limit: 10,
      filters: { search: content.filterText || undefined },
    });
    return res;
  };

  const getNextPageParam = (lastPage: Response, allPages: Response[]) => {
    return lastPage.hasMore ? allPages.length + 1 : undefined;
  };

  const [debouncedFilter] = useDebounce(content.filterText, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isQueryLoading,
  } = useInfiniteQuery({
    queryKey: ['foodList', debouncedFilter],
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

  // useEffect(() => {
  //   fetchNextPage();
  // }, []);

  return (
    <div ref={parentRef} className={styles.scrollContainer} onScroll={handleScroll}>
      <ul
        className={styles.list}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) return null;

          return (
            <li
              key={item.id}
              className={clsx([
                styles.listItem,
                vm.selectedItemId?.variant === item.type &&
                  vm.selectedItemId?.id === item.id &&
                  styles.listItem_active,
              ])}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={() => onFoodSelect(item)}
            >
              <div className={styles.listItem__text}>{item.name}</div>
            </li>
          );
        })}
        {(isFetchingNextPage || isQueryLoading) && (
          <li
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${rowVirtualizer.getTotalSize() - 60}px)`,
              textAlign: 'center',
            }}
          >
            Loading…
          </li>
        )}
      </ul>
    </div>
  );
});

export default List;

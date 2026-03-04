import { List } from '@/components/features/builders/shared/ContentEdit/Food/List';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useState, useMemo } from 'react';
import styles from './SearchFood.module.scss';
import { Instance, SnapshotOut } from 'mobx-state-tree';
import { ScheduleFoodsItem } from '@/domain/schedule/scheduleFood/ScheduleFoods.model';
import { domainStore } from '@/store/store';
import { filterBy } from '@/lib/filter/filter';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import { FoodNutrients } from '@/components/features/builders/shared/components/FoodNutrients';
import {
  useFilteringStateV2,
  UseFilteringStateV2Return,
} from '@/components/features/shared/hooks/useFilteringStateV2';
import { foodSearchConfing } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/config/config';
import { SearchFoodControls } from '@/components/features/builders/shared/components/SearchFood/SearchFoodControls';
import { FoodContentDish, FoodContentProduct } from '@/domain/shared/foodContent/foodContent';

export type SearchMode = 'products-only' | 'products-and-dishes';

type Props = {
  currentProductId?: string | null;
  currentDishId?: string | null;
  onFinish: (payload: { variant: 'product' | 'dish'; id: string }) => void;
  onFocusChange?: (focused: boolean) => void;
  onOpen?: () => void;
  mode: SearchMode;
};

const SearchFood = ({
  onFinish,
  currentProductId,
  currentDishId,
  onFocusChange,
  onOpen,
  mode = 'products-and-dishes',
}: Props) => {
  const [currentInfoFood, setCurrentInfoFood] = useState('');

  // Логика фильтрации - создаётся внутри компонента
  const filterKeys = ['name'] as const;
  const searchState = useFilteringStateV2(
    useMemo(
      () =>
        [
          {
            tabName: 'продукты',
            list: domainStore.foodStore.merged,
            filterKeys,
          },
          {
            tabName: 'блюда',
            list: domainStore.dishStore.merged,
            filterKeys,
          },
        ] as const,
      []
    )
  );

  // Используем внешний searchState или создаём внутренний
  const filterState = searchState;

  const onBackButton = () => setCurrentInfoFood('');

  const onFoodAdd = useCallback(
    (payload: any) => {
      console.log('payload', payload);
      const id = payload.id.toString();
      onFinish({
        variant: 'product',
        id,
      });
    },
    [onFinish]
  );

  const onDishAdd = useCallback(
    (payload: any) => {
      const id = payload.id.toString();

      onFinish({
        variant: 'dish',
        id,
      });
    },
    [onFinish]
  );

  const onProductClickSeeDetails = useCallback(() => {}, []);

  const renderProductItem = useCallback(
    (item: any) => {
      // Mobile click handler to work around keyboard dismissal issue

      return (
        <SearchListItem
          className=""
          onInfoClick={() => setCurrentInfoFood(item.id)}
          active={currentProductId === item.id.toString()}
          onClick={() => onFoodAdd(item)}
          item={item}
        />
      );
    },
    [currentProductId, onFoodAdd]
  );

  const renderDishtItem = useCallback(
    (item: any) => {
      const isActive = currentDishId === item.id.toString();

      // Mobile click handler to work around keyboard dismissal issue

      return (
        <SearchListItem
          className=""
          item={item}
          active={isActive}
          onInfoClick={() => setCurrentInfoFood(item.id)}
        >
          <FoodName content={item} className="ellipsis" onClick={() => onDishAdd(item)} />
        </SearchListItem>
      );
    },
    [currentDishId, onDishAdd, onProductClickSeeDetails]
  );

  return (
    <>
      <div className={styles.content}>
        {currentInfoFood && (
          <div className={styles.foodInfo}>
            <FoodNutrients
              foodId={currentInfoFood}
              className={styles.foodInfoNutrients}
              before={<button onClick={onBackButton}>{'<-'}</button>}
            />
          </div>
        )}

        <div className={styles.header}>
          <SearchFoodControls
            mode={mode}
            searchState={filterState}
            onFocusChange={onFocusChange}
            onOpen={onOpen}
          />
        </div>

        {filterState.currentTab === 'продукты' && (
          <List
            isShow={true}
            after={null}
            queryKey="productSearch"
            onFetch={domainStore.foodStore.getFoodWithParams as any}
            search={filterState}
            renderListContent={renderProductItem}
          />
        )}
        {filterState.currentTab === 'блюда' && mode === 'products-and-dishes' && (
          <List
            isShow={true}
            after={null}
            queryKey="dishSearch"
            onFetch={domainStore.dishStore.getAllWithParams as any}
            search={filterState}
            renderListContent={renderDishtItem}
          />
        )}
      </div>
    </>
  );
};

export default observer(SearchFood);

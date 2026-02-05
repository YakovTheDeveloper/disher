import { List } from '@/components/features/builders/shared/ContentEdit/Food/List';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import styles from './SearchFood.module.scss';
import { Instance, SnapshotOut } from 'mobx-state-tree';
import { ScheduleItem } from '@/domain/schedule/schedule.model';
import { domainStore } from '@/store/store';
import { filterBy } from '@/lib/filter/filter';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import { FoodNutrients } from '@/components/features/builders/shared/components/FoodNutrients';
import { UseFilteringStateV2Return } from '@/components/features/shared/hooks/useFilteringStateV2';
import { foodSearchConfing } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/config/config';
import { SearchFoodControls } from '@/components/features/builders/shared/components/SearchFood/SearchFoodControls';
import { FoodContentDish, FoodContentProduct } from '@/domain/shared/foodContent/foodContent';

export type SearchMode = 'products-only' | 'products-and-dishes';

type Props = {
  currentChild: {
    content: Instance<typeof FoodContentProduct> | Instance<typeof FoodContentDish> | null;
    updateFood: (id: string) => void;
    updateDish?: (id: string) => void;
  };
  onFinish: () => void;
  headerAfter?: React.ReactNode;
  searchState: UseFilteringStateV2Return;
  onFocusChange?: (focused: boolean) => void;
  mode: SearchMode;
};

const SearchFood = ({
  onFinish,
  currentChild,
  searchState,
  onFocusChange,
  mode = 'products-and-dishes',
}: Props) => {
  const [currentInfoFood, setCurrentInfoFood] = useState('');

  const onBackButton = () => setCurrentInfoFood('');

  const { updateFood, updateDish } = currentChild;

  const onFoodAdd = useCallback(
    (payload: any) => {
      console.log('payload', payload);
      updateFood(payload.id.toString());
      onFinish();
    },
    [onFinish, updateFood]
  );

  const onDishAdd = useCallback(
    (payload: any) => {
      updateDish?.(payload.id.toString());
      onFinish();
    },
    [updateDish, onFinish]
  );

  const onProductClickSeeDetails = useCallback(() => {}, []);

  const renderProductItem = useCallback(
    (item: any) => {
      const content = currentChild.content;
      const isActive = content?.variant === 'product' && content.foodId === item.id.toString();

      return (
        <SearchListItem
          className=""
          onInfoClick={() => setCurrentInfoFood(item.id)}
          active={isActive}
          onClick={() => onFoodAdd(item)}
          item={item}
        />
      );
    },
    [currentChild.content, onFoodAdd]
  );

  const renderDishtItem = useCallback(
    (item: any) => {
      const content = currentChild.content;
      const isActive = content?.variant === 'dish' && content.dishId === item.id.toString();

      return (
        <SearchListItem
          className=""
          item={item}
          onInfoClick={() => setCurrentInfoFood(item.id)}
          active={isActive}
        >
          <FoodName content={item} className="ellipsis" onClick={() => onDishAdd(item)} />
        </SearchListItem>
      );
    },
    [currentChild?.content, onDishAdd, onProductClickSeeDetails]
  );

  return (
    <>
      <div className={styles.content}>
        <SearchFoodControls mode={mode} searchState={searchState} onFocusChange={onFocusChange} />
        {currentInfoFood && (
          <div className={styles.foodInfo}>
            <FoodNutrients
              foodId={currentInfoFood}
              className={styles.foodInfoNutrients}
              before={<button onClick={onBackButton}>{'<-'}</button>}
            />
          </div>
        )}

        {searchState.currentTab === 'продукты' && (
          <List
            after={null}
            queryKey="productSearch"
            onFetch={domainStore.foodStore.getFoodWithParams as any}
            search={searchState}
            renderListContent={renderProductItem}
          />
        )}
        {mode === 'products-and-dishes' && searchState.currentTab === 'блюда' && (
          <List
            after={null}
            queryKey="dishSearch"
            onFetch={domainStore.dishStore.getAllWithParams as any}
            search={searchState}
            renderListContent={renderDishtItem}
          />
        )}
      </div>
    </>
  );
};

export default observer(SearchFood);

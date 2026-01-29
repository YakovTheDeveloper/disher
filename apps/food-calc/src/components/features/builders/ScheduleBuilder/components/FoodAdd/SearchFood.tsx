import { List } from '@/components/features/builders/shared/ContentEdit/Food/List';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import styles from './FoodAdd.module.scss';
import { Instance } from 'mobx-state-tree';
import { ScheduleItem } from '@/domain/schedule/schedule';
import { domainStore } from '@/store/store';
import { filterBy } from '@/lib/filter/filter';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import { FoodNutrients } from '@/components/features/builders/shared/components/FoodNutrients';
import {
  FilteringState,
  IFilteringState,
} from '@/components/features/shared/hooks/useFilteringState';
import { foodSearchConfing } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/config/config';

type Props = {
  children?: React.ReactNode;
  scheduleChild: Instance<typeof ScheduleItem>;
  onFinish: () => void;
  headerAfter?: React.ReactNode;
  searchState: FilteringState<
    (typeof foodSearchConfing)[number]['tabName'],
    typeof foodSearchConfing
  >;
  onFocusChange?: (focused: boolean) => void;
};

const SearchFood = ({ scheduleChild, onFinish, children, searchState, onFocusChange }: Props) => {
  // const modals = useDailyScheduleModals();

  const [currentInfoFood, setCurrentInfoFood] = useState('');

  const onBackButton = () => setCurrentInfoFood('');

  const currentChild = scheduleChild;

  const onFoodAdd = useCallback(
    (payload: any) => {
      scheduleChild.updateContent('product', payload.id.toString());
      onFinish();
    },
    [scheduleChild, onFinish]
  );

  const onDishAdd = useCallback(
    (payload: any) => {
      scheduleChild.updateContent('dish', payload.id.toString());
      onFinish();
    },
    [scheduleChild, onFinish]
  );

  const onProductClickSeeDetails = useCallback(() => {}, []);

  const renderProductItem = useCallback(
    (item: any) => {
      const content = currentChild?.content;
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
    [currentChild?.content, onFoodAdd]
  );

  const renderDishtItem = useCallback(
    (item: any) => {
      const content = currentChild?.content;
      const isActive = content?.variant === 'dish' && content.dishId === item.id.toString();

      return (
        <SearchListItem
          className=""
          item={item}
          onInfoClick={() => setCurrentInfoFood(item.id)}
          active={isActive}
        >
          <FoodName
            className="ellipsis"
            onClick={() => onDishAdd(item)}
            onClickHintModeOn={onProductClickSeeDetails}
            hintMode={false}
          >
            {() => item.name}
          </FoodName>
        </SearchListItem>
      );
    },
    [currentChild?.content, onDishAdd, onProductClickSeeDetails]
  );

  return (
    <>
      <div className={styles.content}>
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, { onFocusChange })
          : children}
        {currentInfoFood && (
          <div className={styles.foodInfo}>
            <FoodNutrients
              foodId={currentInfoFood}
              className={styles.foodInfoNutrients}
              before={<button onClick={onBackButton}>{'<-'}</button>}
            />
          </div>
        )}

        {searchState.currentTab === 'продукты' ? (
          <List
            after={null}
            queryKey="productSearch"
            onFetch={domainStore.foodStore.getFoodWithParams as any}
            search={searchState}
            renderListContent={renderProductItem}
          />
        ) : null}
        {searchState.currentTab === 'блюда' ? (
          <List
            after={null}
            queryKey="dishSearch"
            onFetch={domainStore.dishStore.getAllWithParams as any}
            search={searchState}
            renderListContent={renderDishtItem}
          />
        ) : null}
      </div>
    </>
  );
};

export default observer(SearchFood);

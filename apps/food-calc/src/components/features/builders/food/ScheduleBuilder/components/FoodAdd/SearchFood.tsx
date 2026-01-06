import { List } from '@/components/features/builders/food/shared/ContentEdit/Food/List';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { FoodName } from '@/components/features/builders/food/shared/ui/FoodName';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { useState } from 'react';
import styles from './FoodAdd.module.scss';
import { Instance } from 'mobx-state-tree';
import { ScheduleItem } from '@/domain/schedule/schedule';
import { domainStore } from '@/store/store';
import { filterBy } from '@/lib/filter/filter';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import { FoodNutrients } from '@/components/features/builders/food/shared/components/FoodNutrients';

type Props = {
  children?: React.ReactNode;
  scheduleChild: Instance<typeof ScheduleItem>;
  onFinish: () => void;
  headerAfter?: React.ReactNode;
  searchState: any;
};

type Tabs = 'productSearch' | 'dishSearch' | 'createCustom';

const SearchFood = ({ scheduleChild, onFinish, children, searchState }: Props) => {
  // const modals = useDailyScheduleModals();

  const [currentInfoFood, setCurrentInfoFood] = useState('');

  const onBackButton = () => setCurrentInfoFood('');

  const currentChild = scheduleChild;

  const onFinishHandler = () => {};

  const onCustomAdd = (payload: DishEntity | FoodEntity | string) => {
    console.log('onCustomAdd payload', payload);
    scheduleChild.updateCustom({
      customName: payload.toString(),
    });
    onFinish();
  };

  const onFoodAdd = (payload: DishEntity | FoodEntity | string) => {
    scheduleChild.updateFood({
      foodId: payload.id.toString(),
    });
    onFinish();
  };

  const onDishAdd = (payload: DishEntity | FoodEntity | string) => {
    scheduleChild.updateDish({
      dishId: payload.id.toString(),
    });
    onFinish();
  };

  const onProductClickSeeDetails = () => {};

  const onCustomProductAdd = () => {
    console.log('onItemNameClick', searchState.customProductText);

    onCustomAdd(searchState.customProductText);
  };

  console.log('searchState.foodSearchState', searchState.foodSearchState);

  const onInfoClick = () => {};

  const renderProductItem = (item: unknown) => (
    <>
      <SearchListItem
        onInfoClick={() => setCurrentInfoFood(item.id)}
        active={currentChild?.content?.food?.id === item.id}
        onClick={() => onFoodAdd(item)}
        item={item}
      >
        {/* <FoodName
          className="ellipsis"
          onClick={() => onFoodAdd(item)}
          onClickHintModeOn={onProductClickSeeDetails}
        >
          {() => item.name}
        </FoodName> */}
      </SearchListItem>
    </>
  );

  const renderDishtItem = (item: unknown) => (
    <>
      <SearchListItem
        onInfoClick={() => setCurrentInfoFood(item.id)}
        active={currentChild?.content?.dish?.id === item.id}
      >
        <FoodName
          className="ellipsis"
          onClick={() => onDishAdd(item)}
          onClickHintModeOn={onProductClickSeeDetails}
        >
          {() => item.name}
        </FoodName>
      </SearchListItem>
    </>
  );

  const getChildTime = () => currentChild?.time;

  const showActionsBar = () => searchState.currentTab !== 'createCustom';

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
        {
          <>
            {searchState.currentTab === 'productSearch' ? (
              <List
                queryKey="productSearch"
                onFetch={domainStore.foodStore.getFoodWithParams}
                search={searchState.foodSearchState}
                renderListContent={renderProductItem}
              />
            ) : null}
            {searchState.currentTab === 'dishSearch' ? (
              <List
                queryKey="dishSearch"
                onFetch={domainStore.dishStore.getAllWithParams}
                search={searchState.dishSearchState}
                renderListContent={renderDishtItem}
              />
            ) : null}

            {/* Custom product input */}
            {searchState.currentTab === 'createCustom' && (
              <div className={styles.customContainer}>
                <input
                  className={styles.customInput}
                  placeholder="Название кастомного продукта"
                  value={searchState.customProductText}
                  onChange={(e) => searchState.setCustomText(e.target.value)}
                />
                <Button.Finish onClick={onCustomProductAdd} disabled={false} isShow={() => true}>
                  принять
                </Button.Finish>
              </div>
            )}
          </>
        }
      </div>
    </>
  );
};

export default observer(SearchFood);

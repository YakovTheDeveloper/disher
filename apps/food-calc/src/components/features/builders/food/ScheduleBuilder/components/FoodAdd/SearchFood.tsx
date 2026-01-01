import { List } from '@/components/features/builders/food/shared/ContentEdit/Food/List';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { FoodName } from '@/components/features/builders/food/shared/ui/FoodName';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React from 'react';
import styles from './FoodAdd.module.scss';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { domainStore } from '@/store/store';
import { filterBy } from '@/lib/filter/filter';
import { useSearchParams } from 'react-router';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import SearchFoodControls from './SearchFoodControls/SearchFoodControls';
import clsx from 'clsx';

type Props = {
  children?: React.ReactNode;
  scheduleChild: Instance<typeof ScheduleItem>;
  onFinish: () => void;
  headerAfter?: React.ReactNode;
};

type Tabs = 'productSearch' | 'dishSearch' | 'createCustom';

const SearchFood = ({ scheduleChild, onFinish, children }: Props) => {
  // const modals = useDailyScheduleModals();

  const currentChild = scheduleChild;

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

  const state = useLocalObservable(() => ({
    currentTab: 'productSearch' as Tabs,
    filterText: '',
    customProductText: currentChild?.content?.customName || '',

    setTab(tab: Tabs) {
      this.currentTab = tab;
    },

    setSearch(text: string) {
      this.filterText = text;
    },

    setCustomText(text: string) {
      this.customProductText = text;
    },

    foodSearchState: {
      get filterSearchText() {
        return state.filterText;
      },
      get localFiltered() {
        return filterBy(domainStore.foodStore.list, this.filterSearchText, ['name', 'title']);
      },
    },

    dishSearchState: {
      get filterSearchText() {
        return state.filterText;
      },
      get localFiltered() {
        return filterBy(domainStore.dishStore.list, this.filterSearchText, ['name', 'title']);
      },
    },
  }));

  const onProductClickSeeDetails = () => {};

  const onCustomProductAdd = () => {
    console.log('onItemNameClick', state.customProductText);

    onCustomAdd(state.customProductText);
  };

  console.log('state.foodSearchState', state.foodSearchState);

  const renderProductItem = (item: unknown) => (
    <>
      <SearchListItem
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
      <SearchListItem active={currentChild?.content?.dish?.id === item.id}>
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

  const showActionsBar = () => state.currentTab !== 'createCustom';

  return (
    <>
      {state.currentTab !== 'createCustom' && (
        <SearchFoodControls
          currentTab={state.currentTab}
          setTab={state.setTab}
          filterText={state.filterText}
          setSearch={state.setSearch}
          isVisible={true}
        />
      )}

      {state.currentTab === 'productSearch' ? (
        <List
          queryKey="productSearch"
          onFetch={domainStore.foodStore.getFoodWithParams}
          search={state.foodSearchState}
          renderListContent={renderProductItem}
        />
      ) : null}
      {state.currentTab === 'dishSearch' ? (
        <List
          queryKey="dishSearch"
          onFetch={domainStore.dishStore.getAllWithParams}
          search={state.dishSearchState}
          renderListContent={renderDishtItem}
        />
      ) : null}

      {/* Custom product input */}
      {state.currentTab === 'createCustom' && (
        <div className={styles.customContainer}>
          <input
            className={styles.customInput}
            placeholder="Название кастомного продукта"
            value={state.customProductText}
            onChange={(e) => state.setCustomText(e.target.value)}
          />
          <Button.Finish onClick={onCustomProductAdd} disabled={false} isShow={() => true}>
            принять
          </Button.Finish>
        </div>
      )}
    </>
  );
};

export default observer(SearchFood);

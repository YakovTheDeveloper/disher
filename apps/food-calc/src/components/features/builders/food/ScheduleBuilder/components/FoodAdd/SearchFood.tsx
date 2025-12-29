import { SearchListItem } from '@/components/features/builders/food/shared/components/search/SearchListItem';
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
        className={currentChild?.content?.food?.id === item.id ? styles.currentSelectedItem : ''}
      >
        <FoodName onClick={() => onFoodAdd(item)} onClickHintModeOn={onProductClickSeeDetails}>
          {() => item.name}
        </FoodName>
      </SearchListItem>
    </>
  );

  const renderDishtItem = (item: unknown) => (
    <>
      <SearchListItem
        className={currentChild?.content?.dish?.id === item.id ? styles.currentSelectedItem : ''}
      >
        <FoodName onClick={() => onDishAdd(item)} onClickHintModeOn={onProductClickSeeDetails}>
          {() => item.name}
        </FoodName>
      </SearchListItem>
    </>
  );

  const getChildTime = () => currentChild?.time;

  const showActionsBar = () => state.currentTab !== 'createCustom';

  return (
    <>
      {/* Search input */}
      {state.currentTab !== 'createCustom' && (
        <header className={styles.header}>
          <input
            className={styles.searchInput}
            placeholder="Поиск..."
            value={state.filterText}
            onChange={(e) => state.setSearch(e.target.value)}
          />
          <div className={styles.tabs}>
            <span
              className={`${styles.tabButton} ${state.currentTab === 'productSearch' ? styles.active : ''}`}
              onClick={() => state.setTab('productSearch')}
            >
              Продукты
            </span>
            <span
              className={`${styles.tabButton} ${state.currentTab === 'dishSearch' ? styles.active : ''}`}
              onClick={() => state.setTab('dishSearch')}
            >
              Блюда
            </span>
            <span
              className={`${styles.tabButton} ${state.currentTab === 'createCustom' ? styles.active : ''}`}
              onClick={() => state.setTab('createCustom')}
            >
              Свой продукт
            </span>
          </div>
        </header>
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
          onFetch={dishStore.getAllWithParams}
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

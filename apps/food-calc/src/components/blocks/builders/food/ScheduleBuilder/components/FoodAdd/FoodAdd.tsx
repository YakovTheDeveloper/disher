import { SearchListItem } from '@/components/blocks/builders/food/shared/components/search/SearchListItem';
import { List } from '@/components/blocks/builders/food/shared/ContentEdit/Food/List';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';
import { Button } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { Typography } from '@/components/ui/atoms/Typography';
import { dishStore, foodStore } from '@/store/rootStore';
import { toJS } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React from 'react';
import styles from './FoodAdd.module.scss';
import clsx from 'clsx';
import { DayScheduleItemUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { DishEntity } from '@/store/models/dish/types';
import { FoodEntity } from '@/store/models/food/types';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { useDailyScheduleModals } from '@/components/blocks/builders/food/ScheduleBuilder/modalContext';
import { domainStore } from '@/store/store';
import { Time } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List/Time';
import { filterBy } from '@/lib/filter/filter';
import { TimePicker } from '@/components/blocks/builders/food/ScheduleBuilder/components/TimePicker';
import { useSearchParams } from 'react-router';

type Props = {
  children?: React.ReactNode;
  store: Instance<typeof DaySchedule>;
  headerAfter?: React.ReactNode;
};

type Tabs = 'productSearch' | 'dishSearch' | 'createCustom';

const FoodAdd = ({ children, store, headerAfter }: Props) => {
  const modals = useDailyScheduleModals();

  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item_id');

  const currentChild = store.getChildById(itemId);

  const onCustomAdd = (payload: DishEntity | FoodEntity | string) => {
    const customName = payload.toString();
    console.log('onCustomAdd payload', payload);
    store.addOrUpdateCustom(itemId, {
      customName,
      time: state.time,
    });
    modals.close();
  };

  const onFoodAdd = (payload: DishEntity | FoodEntity | string) => {
    console.log('onFoodAdd payload', payload, state.time);
    store.addOrUpdateFood(itemId, {
      foodId: payload.id.toString(),
      time: state.time,
    });
    modals.clear();
  };

  const onDishAdd = (payload: DishEntity | FoodEntity | string) => {
    console.log('onDishAdd payload', payload);
    store.addOrUpdateDish(itemId, {
      dishId: payload.id.toString(),
      time: state.time,
    });
    modals.close();
  };

  const onTimeChangeFinishUpdate = (value: string) => {
    store.updateTime(itemId, value);
  };

  const onTimeChangeFinishLocalState = (value: string) => {
    state.setTime(value);
  };

  const state = useLocalObservable(() => ({
    currentTab: 'productSearch' as Tabs,
    filterText: '',
    customProductText: currentChild?.content?.name || '',
    time: store.lastTimeItemAdded || '08:00',

    setTime(time: string) {
      this.time = time;
    },

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

  const settings = useLocalObservable(() => ({
    showAdditionals: false,

    setShowAdditionals(value: boolean) {
      this.showAdditionals = value;
    },

    toggle() {
      this.showAdditionals = !this.showAdditionals;
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
        <FoodName
          onClick={() => onFoodAdd(item)}
          onClickHintModeOn={onProductClickSeeDetails}
          hintMode={settings.showAdditionals}
        >
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
        <FoodName
          onClick={() => onDishAdd(item)}
          onClickHintModeOn={onProductClickSeeDetails}
          hintMode={settings.showAdditionals}
        >
          {() => item.name}
        </FoodName>
      </SearchListItem>
    </>
  );

  const getChildTime = () => currentChild?.time;

  const showActionsBar = () => state.currentTab !== 'createCustom';

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <span
          className={`${styles.tabsItem} ${state.currentTab === 'productSearch' ? styles.active : ''}`}
          onClick={() => state.setTab('productSearch')}
        >
          Продукты
        </span>
        <span
          className={`${styles.tabsItem} ${state.currentTab === 'dishSearch' ? styles.active : ''}`}
          onClick={() => state.setTab('dishSearch')}
        >
          Блюда
        </span>
        <span
          className={`${styles.tabsItem} ${state.currentTab === 'createCustom' ? styles.active : ''}`}
          onClick={() => state.setTab('createCustom')}
        >
          Кастомный продукт
        </span>
        {children}
      </div>

      <header className={clsx([styles.infoTitleContainer])}>
        <h2
          className={clsx([styles.infoTitle, settings.showAdditionals && styles.infoTitle_active])}
        >
          {state.currentTab === 'productSearch' && (
            <Typography variant="info">
              {settings.showAdditionals && <span>Узнать о продукте</span>}
              {!settings.showAdditionals && <span>Добавить продукт</span>}
            </Typography>
          )}
          {state.currentTab === 'dishSearch' && (
            <Typography variant="info">
              {settings.showAdditionals && <span>Редактировать блюдо</span>}
              {!settings.showAdditionals && <span>Добавить блюдо</span>}
            </Typography>
          )}
          {state.currentTab === 'createCustom' && (
            <Typography variant="info">
              {currentChild ? 'Обновить название' : 'Создать продукт'}
            </Typography>
          )}
        </h2>

        <div>
          {currentChild && (
            <TimePicker value={currentChild?.time} onFinish={onTimeChangeFinishUpdate} />
          )}
          {!currentChild && (
            <TimePicker value={state.time} onFinish={onTimeChangeFinishLocalState} />
          )}
        </div>
      </header>

      {/* Search input */}
      {state.currentTab !== 'createCustom' && (
        <input
          className={styles.searchInput}
          placeholder="Поиск..."
          value={state.filterText}
          onChange={(e) => state.setSearch(e.target.value)}
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

      <Actions isShow={showActionsBar} className={styles.actions}>
        <Button.AdditionalOptions
          isShow={() => true}
          className={styles.additionalButton}
          options={settings}
          onClick={settings.toggle}
        ></Button.AdditionalOptions>
      </Actions>
    </div>
  );
};

export default observer(FoodAdd);

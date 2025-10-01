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

type Props = {
  children?: React.ReactNode;
  onChoose: (payload: DishEntity | FoodEntity | string) => void;
  store: {
    currentChild: DayScheduleItemUI | null;
  };
};

type Tabs = 'productSearch' | 'dishSearch' | 'createCustom';

const FoodAdd = ({ children, onChoose, store }: Props) => {
  const currentChild = store.currentChild;
  const state = useLocalObservable(() => ({
    currentTab: 'productSearch' as Tabs,
    filterText: '',
    customProductText: currentChild?.customFoodName || '',

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
        const q = this.filterSearchText.trim().toLowerCase();
        if (!q) return foodStore.list ?? [];
        return (foodStore.list ?? []).filter((p: any) =>
          ((p.name ?? p.title ?? '') + '').toLowerCase().includes(q)
        );
      },
    },

    dishSearchState: {
      get filterSearchText() {
        return state.filterText;
      },
      get localFiltered() {
        const q = this.filterSearchText.trim().toLowerCase();
        if (!q) return dishStore.list ?? [];
        return (dishStore.list ?? []).filter((d: any) =>
          ((d.name ?? d.title ?? '') + '').toLowerCase().includes(q)
        );
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

  console.log('wtf', toJS(dishStore.list), toJS(foodStore.list));

  const onItemNameClick = (item: unknown) => {
    onChoose(item);
  };

  const onProductClickSeeDetails = () => {};

  const onCustomProductAdd = () => {
    console.log('onItemNameClick', state.customProductText);

    onChoose(state.customProductText);
  };

  const renderProductItem = (item: unknown) => (
    <>
      <SearchListItem
        className={currentChild?.food?.id === item.id ? styles.currentSelectedItem : ''}
      >
        <FoodName
          onClick={() => onItemNameClick(item)}
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
        className={currentChild?.dish?.id === item.id ? styles.currentSelectedItem : ''}
      >
        <FoodName
          onClick={() => onItemNameClick(item)}
          onClickHintModeOn={onProductClickSeeDetails}
          hintMode={settings.showAdditionals}
        >
          {() => item.name}
        </FoodName>
      </SearchListItem>
    </>
  );

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

      <h2 className={clsx([styles.infoTitle, settings.showAdditionals && styles.infoTitle_active])}>
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
          onFetch={foodStore.getFoodWithParams}
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
          <Button.Finish onClick={onCustomProductAdd} disabled={false}>
            принять
          </Button.Finish>
        </div>
      )}

      <Actions isShow={showActionsBar}>
        <Button.AdditionalOptions
          className={styles.additionalButton}
          options={settings}
        ></Button.AdditionalOptions>
      </Actions>
    </div>
  );
};

export default observer(FoodAdd);

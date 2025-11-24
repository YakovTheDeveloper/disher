import { SearchListItem } from '@/components/blocks/builders/food/shared/components/search/SearchListItem';
import { List } from '@/components/blocks/builders/food/shared/ContentEdit/Food/List';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';
import { Button } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { Typography } from '@/components/ui/atoms/Typography';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React from 'react';
import clsx from 'clsx';
import styles from './FoodAdd.module.scss';
import { DaySchedule } from '@/domain/schedule/schedule';
import { Instance } from 'mobx-state-tree';

import { domainStore } from '@/store/store';
import { useDishModals } from '@/components/blocks/builders/food/DishBuilder/modalContext';
import { Dish } from '@/domain/dish/Dish';

type Props = {
  children?: React.ReactNode;
  store: Instance<typeof Dish>;
};

const FoodAdd = ({ children, store }: Props) => {
  const modals = useDishModals();

  const currentChild = store.current;

  const onFoodAdd = (item: any) => {
    store.addOrUpdateChild(item.id);
    modals.close();
  };

  const state = useLocalObservable(() => ({
    filterText: '',

    setSearch(v: string) {
      this.filterText = v;
    },

    foodSearchState: {
      get filterSearchText() {
        return state.filterText;
      },
      get localFiltered() {
        const q = this.filterSearchText.trim().toLowerCase();
        if (!q) return domainStore.foodStore.list ?? [];
        return (domainStore.foodStore.list ?? []).filter((p: any) =>
          (p.name ?? '').toLowerCase().includes(q)
        );
      },
    },
  }));

  const settings = useLocalObservable(() => ({
    showAdditionals: false,

    toggle() {
      this.showAdditionals = !this.showAdditionals;
    },
  }));

  const renderFoodItem = (item: any) => (
    <SearchListItem
      className={currentChild?.food?.id === item.id ? styles.currentSelectedItem : ''}
    >
      <FoodName
        onClick={() => onFoodAdd(item)}
        onClickHintModeOn={() => {}}
        hintMode={settings.showAdditionals}
      >
        {() => item.name}
      </FoodName>
    </SearchListItem>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <h2 className={clsx([styles.infoTitle, settings.showAdditionals && styles.infoTitle_active])}>
        <Typography variant="info">
          {settings.showAdditionals ? 'Узнать о продукте' : 'Добавить продукт'}
        </Typography>
      </h2>

      {/* Search */}
      <input
        className={styles.searchInput}
        placeholder="Поиск..."
        value={state.filterText}
        onChange={(e) => state.setSearch(e.target.value)}
      />

      {/* Food List */}
      <List
        queryKey="productSearch"
        onFetch={domainStore.foodStore.getFoodWithParams}
        search={state.foodSearchState}
        renderListContent={renderFoodItem}
      />

      <Actions isShow={() => true} className={styles.actions}>
        <Button.AdditionalOptions
          isShow={() => true}
          className={styles.additionalButton}
          options={settings}
          onClick={settings.toggle}
        />
      </Actions>

      {children}
    </div>
  );
};

export default observer(FoodAdd);

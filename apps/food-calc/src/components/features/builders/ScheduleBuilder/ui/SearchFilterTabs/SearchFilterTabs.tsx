import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './SearchFilterTabs.module.scss';
import { FilterOptions } from '@/components/features/builders/ScheduleBuilder/model/SearchViewModel';

type Props = {
  children?: React.ReactNode;
  model: {
    filter: FilterOptions;
    setFilter: (option: { dish: boolean; food: boolean }) => void;
  };
};

const SearchFilterTabs = ({ children, model }: Props) => {
  console.log('model', model);
  const handleToggle = (filterName: 'dish' | 'food') => {
    const newValue = !model.filter[filterName];
    if (!newValue && !model.filter[filterName === 'dish' ? 'food' : 'dish']) {
      return;
    }
    const updatedFilters = { ...model.filter, [filterName]: newValue };
    model.setFilter(updatedFilters);
  };

  return (
    <div className={styles.tabs}>
      <span
        className={`${styles.tabsItem} ${model.filter.food ? styles.active : ''}`}
        onClick={() => handleToggle('food')}
      >
        продукты
      </span>
      <span
        className={`${styles.tabsItem} ${model.filter.dish ? styles.active : ''}`}
        onClick={() => handleToggle('dish')}
      >
        блюда
      </span>
      <span
        className={`${styles.tabsItem} ${model.filter.dish ? styles.active : ''}`}
        onClick={() => handleToggle('dish')}
      >
        кастомный продукт
      </span>
      {children}
    </div>
  );
};

export default observer(SearchFilterTabs);

import { observer, useLocalObservable } from 'mobx-react-lite';
import React from 'react';
import SearchIcon from '@/assets/icons/search.svg';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

type Tabs = 'productSearch' | 'dishSearch' | 'createCustom';

type Props = {
  currentTab: Tabs;
  setTab: (tab: Tabs) => void;
  filterText: string;
  setSearch: (text: string) => void;
  isVisible: boolean;
};

const SearchFoodControls = ({ currentTab, setTab, filterText, setSearch, isVisible }: Props) => {
  const localState = useLocalObservable(() => ({
    isSearchOpen: false,
    setIsSearchOpen(open: boolean) {
      this.isSearchOpen = open;
    },
  }));

  if (!isVisible) return null;

  return (
    <header className={styles.header}>
      <input
        className={clsx(
          styles.searchInput,
          localState.isSearchOpen ? styles.searchInputOpen : styles.searchInputClosed
        )}
        placeholder="Например, рис"
        value={filterText}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button
        className={clsx(
          styles.searchButton,
          localState.isSearchOpen ? styles.searchButtonHidden : styles.searchButtonVisible
        )}
        onClick={() => localState.setIsSearchOpen(true)}
      >
        <SearchIcon />
      </button>
      <div
        className={clsx(styles.tabs, localState.isSearchOpen ? styles.tabsColumn : styles.tabsRow)}
      >
        <span
          className={`${styles.tabButton} ${currentTab === 'productSearch' ? styles.active : ''}`}
          onClick={() => setTab('productSearch')}
        >
          Продукты
        </span>
        <span
          className={`${styles.tabButton} ${currentTab === 'dishSearch' ? styles.active : ''}`}
          onClick={() => setTab('dishSearch')}
        >
          Блюда
        </span>
        <span
          className={`${styles.tabButton} ${currentTab === 'createCustom' ? styles.active : ''}`}
          onClick={() => setTab('createCustom')}
        >
          Свой продукт
        </span>
      </div>
    </header>
  );
};

export default observer(SearchFoodControls);

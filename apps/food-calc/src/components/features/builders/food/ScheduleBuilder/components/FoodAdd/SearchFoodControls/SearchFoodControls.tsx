import { observer, useLocalObservable } from 'mobx-react-lite';
import { useRef } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useInteractions,
  useClick,
} from '@floating-ui/react';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';

type Tabs = 'productSearch' | 'dishSearch' | 'createCustom';

type Props = {
  searchState: any;
  isVisible: boolean;
};

const SearchFoodControls = ({ searchState, isVisible }: Props) => {
  const navigate = useNavigate();

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const localState = useLocalObservable(() => ({
    isSearchOpen: false,
    setIsSearchOpen(open: boolean) {
      this.isSearchOpen = open;
    },
    dropdownOpen: false,
    setDropdownOpen(open: boolean) {
      this.dropdownOpen = open;
    },
  }));

  const getTabLabel = (tab: Tabs) => {
    switch (tab) {
      case 'productSearch':
        return 'Продукты';
      case 'dishSearch':
        return 'Блюда';
      case 'createCustom':
        return 'Свой продукт';
      default:
        return '';
    }
  };

  const getFilterLabel = (tab: string) => {
    switch (tab) {
      case 'all':
        return 'Все категории';
      case 'vegan':
        return 'Веганские';
      case 'vegeterian':
        return 'Вегетерианские';
      default:
        return 'Все категории';
    }
  };

  const { x, y, refs, strategy, context } = useFloating({
    open: localState.dropdownOpen,
    onOpenChange: localState.setDropdownOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift()],
  });

  const click = useClick(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click]);

  if (!isVisible) return null;

  return (
    <header className={styles.header}>
      <input
        id="search-input"
        ref={searchInputRef}
        className={clsx(styles.searchInput, styles.searchInputOpen)}
        placeholder="Например, рис"
        value={searchState.filterText}
        onChange={(e) => searchState.setSearch(e.target.value)}
      />
      <div className={styles.tabs}>
        <span
          ref={refs.setReference}
          className={`${styles.tabButton} ${styles.active}`}
          {...getReferenceProps()}
        >
          {getTabLabel(searchState.currentTab)}
        </span>

        {localState.dropdownOpen && (
          <div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              zIndex: 1050,
            }}
            className={styles.dropdownMenu}
            {...getFloatingProps()}
          >
            <div
              className={styles.dropdownItem}
              onClick={() => {
                searchState.setTab('productSearch');
                localState.setDropdownOpen(false);
              }}
            >
              Продукты
            </div>
            <div
              className={styles.dropdownItem}
              onClick={() => {
                searchState.setTab('dishSearch');
                localState.setDropdownOpen(false);
              }}
            >
              Блюда
            </div>
            <div
              className={styles.dropdownItem}
              onClick={() => {
                searchState.setTab('createCustom');
                localState.setDropdownOpen(false);
              }}
            >
              Свой продукт
            </div>
          </div>
        )}
      </div>
      <span
        ref={refs.setReference}
        className={`${styles.tabButton} ${styles.active}`}
        {...getReferenceProps()}
      >
        {getFilterLabel(searchState.currentTab)}
      </span>

      {/* {searchState.currentTab === 'productSearch' && (
        <button className={`${styles.createFoodButton} ${styles.active}`} onClick={() => navigate(RouterLinks.DishBuilder)}>+ Создать</button>
      )} */}
      {searchState.currentTab === 'dishSearch' && (
        <button
          className={`${styles.createFoodButton} ${styles.active}`}
          onClick={() => navigate(RouterLinks.DishBuilder)}
        >
          + Создать
        </button>
      )}
    </header>
  );
};

export default observer(SearchFoodControls);

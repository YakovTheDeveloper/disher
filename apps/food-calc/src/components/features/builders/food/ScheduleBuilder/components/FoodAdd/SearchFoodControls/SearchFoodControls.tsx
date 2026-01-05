import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { useRef } from 'react';
import SearchIcon from '@/assets/icons/search.svg';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';
import { motion } from 'framer-motion';

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useMergeRefs,
  FloatingPortal,
  useClick,
} from '@floating-ui/react';

type Tabs = 'productSearch' | 'dishSearch' | 'createCustom';

type Props = {
  searchState: any;
  isVisible: boolean;
};

const SearchFoodControls = ({ searchState, isVisible }: Props) => {
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

  const onSearchButtonClick = () => {
    localState.setIsSearchOpen(true);
    const drawerContainer = document.getElementById('drawer-content-scrollable');
    searchInputRef.current?.focus();
    if (drawerContainer) {
      drawerContainer.scrollTo({
        top: -200, // прокручиваем к верху
        behavior: 'smooth', // плавная прокрутка
      });
    }
  };

  const { x, y, refs, strategy, context } = useFloating({
    open: localState.dropdownOpen,
    onOpenChange: localState.setDropdownOpen,
    placement: 'bottom',
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
        <FloatingPortal>
          {localState.dropdownOpen && (
            <div
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
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
        </FloatingPortal>
      </div>
    </header>
  );
};

export default observer(SearchFoodControls);

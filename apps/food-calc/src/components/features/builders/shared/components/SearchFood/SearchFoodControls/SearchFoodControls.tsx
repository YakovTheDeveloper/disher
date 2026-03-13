import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import { emitter } from '@/infrastructure/emitter/emitter';
import { Button } from '@/components/ui/atoms/Button';
import { UseFilteringStateV2Return } from '@/components/features/shared/hooks/useFilteringStateV2';
import { ButtonBack } from '@/components/ui/atoms/Button/ButtonBack';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { SearchMode } from '@/components/features/builders/shared/components/SearchFood/SearchFood';

type Tabs = 'продукты' | 'блюда';

type Props = {
  searchState: UseFilteringStateV2Return;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
  hasBackButton?: boolean;
  toggleFilterPanel: () => void;
  selectedSubFilter?: string | null;
  mode: SearchMode;
  actionLeft?: React.ReactNode;
  actionRight?: React.ReactNode;
};

const SearchFoodControls = ({
  searchState,
  className,
  onFocusChange,
  toggleFilterPanel,
  mode,
  actionLeft,
  actionRight,
}: Props) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const getBackTitle = () => {
    if (mode === 'dishes-only') return 'Блюдо';
    if (mode === 'products-only') return 'Продукт';
    return 'Еда';
  };

  return (
    <header className={clsx([styles.header, className])}>
      {actionLeft}

      <TextBehind text={getBackTitle()} position="middle-left">
        <SearchInput
          size="medium"
          ref={searchInputRef}
          className={styles.largeSearchInput}
          placeholder="Поиск"
          value={searchState.searchQuery}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onChange={(e) => {
            searchState.setSearch(e.target.value);
          }}
        />
      </TextBehind>

      <Button variant="filter" className={`${styles.active}`} onClick={toggleFilterPanel}>
        {searchState.currentTab}
      </Button>

      {actionRight}
    </header>
  );
};

export default observer(SearchFoodControls);

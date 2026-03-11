import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import { emitter } from '@/infrastructure/emitter/emitter';
import { Button } from '@/components/ui/atoms/Button';
import { UseFilteringStateV2Return } from '@/components/features/shared/hooks/useFilteringStateV2';
import { ButtonBack } from '@/components/ui/atoms/Button/ButtonBack';

type Tabs = 'продукты' | 'блюда';

type Props = {
  searchState: UseFilteringStateV2Return;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
  hasBackButton?: boolean;
  toggleFilterPanel: () => void;
  selectedSubFilter?: string | null;
};

const SearchFoodControls = ({
  searchState,
  className,
  onFocusChange,
  toggleFilterPanel,
}: Props) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <header className={clsx([styles.header, className])}>
      <ButtonBack onClick={() => emitter.emit('back')} />

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

      <Button variant="filter" className={`${styles.active}`} onClick={toggleFilterPanel}>
        {searchState.currentTab}
      </Button>
    </header>
  );
};

export default observer(SearchFoodControls);

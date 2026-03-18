import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import { SearchState } from '@/components/features/builders/shared/ContentEdit/Food/List/List.types';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { SearchMode } from '@/components/features/builders/shared/components/SearchFood/SearchFood';

type Props = {
  searchState: SearchState;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
  hasBackButton?: boolean;
  toggleFilterPanel: () => void;
  selectedSubFilter?: string | null;
  mode: SearchMode;
  actionLeft?: React.ReactNode;
  actionRight?: React.ReactNode;
  inputId?: string;
};

const SearchFoodControls = ({
  searchState,
  className,
  onFocusChange,
  toggleFilterPanel,
  mode,
  actionLeft,
  actionRight,
  inputId,
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
          id={inputId}
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

      <button className={styles.tabChip} onClick={toggleFilterPanel}>
        {searchState.currentTab}
      </button>

      {actionRight}
    </header>
  );
};

export default observer(SearchFoodControls);

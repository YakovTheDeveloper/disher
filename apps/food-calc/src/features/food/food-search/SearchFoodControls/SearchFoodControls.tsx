import { useRef } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import SearchInput from '@/shared/ui/atoms/input/SearchInput/SearchInput';
import TextBehind from '@/shared/ui/TextBehind/TextBehind';
import { ButtonBack } from '@/shared/ui/atoms/Button/ButtonBack';
import { SearchMode } from '@/features/food/food-search/SearchFood';

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
  mode: SearchMode;
  onBack?: () => void;
  searchBarLeftChild?: React.ReactNode;
  searchBarRightChild?: React.ReactNode;
  inputId?: string;
};

const SearchFoodControls = ({
  searchQuery,
  onSearchChange,
  className,
  mode,
  onBack,
  searchBarLeftChild,
  searchBarRightChild,
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
      {onBack && <ButtonBack size="medium" onClick={onBack} />}
      {searchBarLeftChild}

      <TextBehind text={getBackTitle()} position="middle-left">
        <SearchInput
          id={inputId}
          size="medium"
          ref={searchInputRef}
          className={styles.largeSearchInput}
          placeholder="Поиск"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </TextBehind>

      {searchBarRightChild}
    </header>
  );
};

export default SearchFoodControls;

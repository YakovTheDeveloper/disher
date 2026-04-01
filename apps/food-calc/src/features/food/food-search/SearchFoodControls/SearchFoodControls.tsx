import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import SearchIcon from '@/shared/assets/icons/lupa.svg';
import CrossIcon from '@/shared/assets/icons/cross.svg';

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
  onBack?: () => void;
  searchBarLeftChild?: React.ReactNode;
  searchBarRightChild?: React.ReactNode;
  inputId?: string;
};

const SearchFoodControls = ({
  searchQuery,
  onSearchChange,
  className,
  onBack,
  searchBarLeftChild,
  searchBarRightChild,
  inputId,
}: Props) => {
  return (
    <header className={clsx([styles.header, className])}>
      {onBack && (
        <button className={styles.backButton} onClick={onBack} type="button">
          <svg
            width="36"
            height="20"
            viewBox="0 0 36 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="34"
              y1="10"
              x2="2"
              y2="10"
              stroke="black"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M12 2L2 10L12 18"
              stroke="black"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      )}
      {searchBarLeftChild}

      <div className={styles.searchWrapper}>
        <div className={styles.searchIcon}>
          <SearchIcon />
        </div>
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={styles.searchInput}
          placeholder="Поиск"
          id={inputId ?? 'search'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => onSearchChange('')}
            aria-label="Очистить поиск"
          >
            <CrossIcon />
          </button>
        )}
      </div>

      {searchBarRightChild}
    </header>
  );
};

export default SearchFoodControls;

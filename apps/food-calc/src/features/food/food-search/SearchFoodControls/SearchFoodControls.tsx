import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';
import { Heading } from '@/shared/ui/atoms/Typography';
import type { SearchFilter } from '../SearchFood';
import { FILTER_LABELS } from '../SearchFood';

import SearchIcon from '@/shared/assets/icons/lupa.svg?react';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
  onBack?: () => void;
  inputId?: string;
  /** Когда задан и `filterOptions` пуст — слева встаёт статический заголовок (serif italic). */
  title?: string;
  /** Когда задан — слева встаёт бинарный pill-toggle, кликабельные опции. */
  filterOptions?: readonly SearchFilter[];
  selectedFilter?: SearchFilter;
  onSelectFilter?: (next: SearchFilter) => void;
};

const SearchFoodControls = ({
  searchQuery,
  onSearchChange,
  className,
  onBack,
  inputId,
  title,
  filterOptions,
  selectedFilter,
  onSelectFilter,
}: Props) => {
  const hasFilter = Boolean(filterOptions && filterOptions.length > 1 && selectedFilter && onSelectFilter);

  return (
    <header className={clsx(styles.header, hasFilter && styles.headerWithFilter, className)}>
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

      {!hasFilter && title && (
        <Heading size="drawer" as="h2" className={styles.title}>
          {title}
        </Heading>
      )}

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

      {hasFilter && filterOptions && (
        <div className={styles.filterToggle} role="tablist" aria-label="Фильтр поиска">
          {filterOptions.map((opt) => {
            const isActive = opt === selectedFilter;
            return (
              <button
                key={opt}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={clsx(
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                )}
                onClick={() => onSelectFilter?.(opt)}
              >
                {FILTER_LABELS[opt]}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default SearchFoodControls;

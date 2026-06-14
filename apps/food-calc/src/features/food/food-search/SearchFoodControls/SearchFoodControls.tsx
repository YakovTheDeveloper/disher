import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';
import { Heading } from '@/shared/ui/atoms/Typography';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import type { SearchFilter } from '../SearchFood';
import { FILTER_LABELS } from '../SearchFood';

import SearchIcon from '@/shared/assets/icons/lupa.svg?react';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import NutrientIcon from '@/shared/assets/icons/chart-bars.svg?react';

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
  /** Второй ряд «Нутриенты»: idle — pill-кнопка справа (открывает drawer-выбор);
   *  выбран — «Еда богатая нутриентом: X» + крестик отмены. Скрыт в dishes-only. */
  showNutrientFilter?: boolean;
  selectedNutrientLabel?: string | null;
  onOpenNutrientPicker?: () => void;
  onClearNutrient?: () => void;
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
  showNutrientFilter,
  selectedNutrientLabel,
  onOpenNutrientPicker,
  onClearNutrient,
}: Props) => {
  const hasFilter = Boolean(
    filterOptions && filterOptions.length > 1 && selectedFilter && onSelectFilter
  );

  return (
    <div className={clsx(styles.controls, className)}>
      {/* One common bar: the back button sits OUTSIDE to the left, everything else
          — search field + (segmented Еда|Мое) + the nutrient («richness») button —
          rides inside a single pill. Collapsing the old two rows (scope + search)
          into one pill saves vertical space. In dishes-only mode there's no filter
          and no nutrient button, so a static serif title stands beside the pill. */}
      <div className={styles.bar}>
        {onBack && <BackButton onClick={onBack} />}

        {!hasFilter && title && (
          <Heading size="drawer" as="h2" className={styles.title}>
            {title}
          </Heading>
        )}

        <div className={styles.pill}>
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

          {hasFilter && filterOptions && (
            <div className={styles.segmented} role="tablist" aria-label="Фильтр поиска">
              {filterOptions.map((opt) => {
                const isActive = opt === selectedFilter;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={clsx(styles.segment, isActive && styles.segmentActive)}
                    onClick={() => onSelectFilter?.(opt)}
                  >
                    {FILTER_LABELS[opt]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Нутриент-фильтр в баре: idle — ghost-иконка (открывает drawer-выбор);
              выбран — чёрная пилюля «иконка · имя · ×» в духе сегмента Всё|Мое.
              Инпут (flex:1, min-width:0) ужимается под неё. */}
          {showNutrientFilter && !selectedNutrientLabel && (
            <button
              type="button"
              className={styles.nutrientIconButton}
              onClick={onOpenNutrientPicker}
              aria-label="Фильтр по нутриенту"
              title="Нутриенты"
            >
              <NutrientIcon />
            </button>
          )}

          {showNutrientFilter && selectedNutrientLabel && (
            <div className={styles.nutrientPill}>
              <button
                type="button"
                className={styles.nutrientPillMain}
                onClick={onOpenNutrientPicker}
                aria-label={`Нутриент: ${selectedNutrientLabel}. Изменить`}
              >
                <NutrientIcon />
                <span className={styles.nutrientPillLabel}>{selectedNutrientLabel}</span>
              </button>
              <button
                type="button"
                className={styles.nutrientPillClear}
                onClick={onClearNutrient}
                aria-label="Отменить выбор нутриента"
              >
                <CrossIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFoodControls;

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
  const hasFilter = Boolean(filterOptions && filterOptions.length > 1 && selectedFilter && onSelectFilter);

  const hasTopRow = Boolean(onBack || hasFilter || title || showNutrientFilter);

  return (
    <div className={clsx(styles.controls, className)}>
      {/* Row A — scope controls: back + (segmented Еда|Мое OR static title) on the
          left, the nutrient-filter icon pushed to the right. The segmented control
          is one connected track with a single moving thumb (iOS / M3 «connected
          button group»), so the two scopes read as equal peers — not a heavy dark
          pill beside a ghost outline. The nutrient filter is a separate ghost
          icon-action, deliberately NOT styled like a segment. */}
      {hasTopRow && (
        <div className={clsx(styles.topRow, hasFilter && styles.topRowWithFilter)}>
          {onBack && <BackButton onClick={onBack} />}

          {hasFilter && filterOptions ? (
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
          ) : (
            title && (
              <Heading size="drawer" as="h2" className={styles.title}>
                {title}
              </Heading>
            )
          )}

          <div className={styles.topRowSpacer} />

          {showNutrientFilter && (
            <button
              type="button"
              className={clsx(
                styles.nutrientIconButton,
                selectedNutrientLabel && styles.nutrientIconButtonActive,
              )}
              onClick={onOpenNutrientPicker}
              aria-label="Фильтр по нутриенту"
              aria-pressed={Boolean(selectedNutrientLabel)}
              title="Нутриенты"
            >
              <NutrientIcon />
            </button>
          )}
        </div>
      )}

      {/* Row B — search gets its own full-width container row (the field reads as a
          field, not a faint decorative pill). */}
      <div className={styles.searchRow}>
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
      </div>

      {showNutrientFilter && selectedNutrientLabel && (
        <div className={styles.nutrientRow}>
          <div className={styles.nutrientSelected}>
            <button
              type="button"
              className={styles.nutrientSelectedText}
              onClick={onOpenNutrientPicker}
            >
              Еда богатая нутриентом: <strong>{selectedNutrientLabel}</strong>
            </button>
            <button
              type="button"
              className={styles.nutrientClear}
              onClick={onClearNutrient}
              aria-label="Отменить выбор нутриента"
            >
              <CrossIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFoodControls;

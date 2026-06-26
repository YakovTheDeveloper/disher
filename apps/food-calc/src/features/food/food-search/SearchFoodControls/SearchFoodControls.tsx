import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import { IconButton } from '@/shared/ui/atoms/Button';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import type { SearchFilter } from '../SearchFood';
import { FILTER_LABELS } from '../searchFilterLabels';

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
    // One common bar = the component root (бывшая обёртка .controls убрана 2026-06-26 —
    // была пустой колонкой-пустышкой). The back button sits OUTSIDE to the left,
    // everything else — search field + (segmented Еда|Мое) + the nutrient («richness»)
    // button — rides inside a single pill. In dishes-only mode there's no filter and
    // no nutrient button, so a static serif title stands beside the pill.
    <div className={clsx(styles.bar, className)}>
      {onBack && <BackButton onClick={onBack} />}

      {!hasFilter && title && (
        <Heading role="headline" as="h2" className={styles.title}>
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
          <IconButton
            className={styles.clearButton}
            onClick={() => onSearchChange('')}
            aria-label="Очистить поиск"
            icon={<CrossIcon />}
          />
        )}

        {hasFilter && filterOptions && (
          <ChoiceGroup
            variant="segmented"
            value={selectedFilter}
            onChange={(next) => onSelectFilter?.(next as SearchFilter)}
            aria-label="Фильтр поиска"
            className={styles.segmented}
          >
            {filterOptions.map((opt) => (
              <ChoiceItem key={opt} value={opt}>
                {FILTER_LABELS[opt]}
              </ChoiceItem>
            ))}
          </ChoiceGroup>
        )}

        {/* Нутриент-фильтр в баре: idle — ghost-иконка (открывает drawer-выбор);
              выбран — чёрная пилюля «иконка · имя · ×» в духе сегмента Всё|Мое.
              Инпут (flex:1, min-width:0) ужимается под неё. */}
        {showNutrientFilter && !selectedNutrientLabel && (
          <IconButton
            tone="neutral"
            size={36}
            className={styles.nutrientIconCold}
            onClick={onOpenNutrientPicker}
            aria-label="Фильтр по нутриенту"
            title="Нутриенты"
            icon={<NutrientIcon width={20} height={20} />}
          />
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
              <Text as="span" role="label" className={styles.nutrientPillLabel}>
                {selectedNutrientLabel}
              </Text>
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
  );
};

export default SearchFoodControls;

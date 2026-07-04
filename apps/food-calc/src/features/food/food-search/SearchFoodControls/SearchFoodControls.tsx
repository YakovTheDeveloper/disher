import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import { IconButton } from '@/shared/ui/atoms/Button';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';
import type { SearchFilter } from '../SearchFood';
import { FILTER_LABELS } from '../searchFilterLabels';

import SearchIcon from '@/shared/assets/icons/lupa.svg?react';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import NutrientIcon from '@/shared/assets/icons/chart-bars.svg?react';
import FilterIcon from '@/shared/assets/icons/filter-icon.svg?react';

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

  // Кнопка-«ползунки» (фильтр+сортировка за popover) встаёт только когда есть что
  // прятать: сегмент Всё|Мое и/или нутриент-фильтр. В dishes-only обоих нет — бар
  // несёт только статичный заголовок рядом с поиском.
  const showFilterButton = hasFilter || Boolean(showNutrientFilter);

  // Активный фильтр (не-дефолт) подсвечивает кнопку точкой — состояние читается, не
  // открывая panel. «Мое» (сужает каталог) или выбранный нутриент = активны.
  const filterActive = (hasFilter && selectedFilter === 'mine') || Boolean(selectedNutrientLabel);

  // Содержимое popover: тот же сегмент Всё|Мое + строка нутриент-фильтра, но
  // собранные в компактную панель под кнопкой (раньше распирали search-пилюлю).
  // Выбор нутриента по-прежнему уводит в боковой NutrientPickerDrawer (длинный
  // сгруппированный список не лезет в popover) — здесь только триггер + текущее
  // состояние с крестиком отмены.
  const filterPanel = (
    <div className={styles.filterPanel}>
      {hasFilter && filterOptions && (
        <div className={styles.filterSection}>
          <Text as="span" role="label" className={styles.filterSectionLabel}>
            Показывать
          </Text>
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
        </div>
      )}

      {showNutrientFilter && (
        <div className={styles.filterSection}>
          <Text as="span" role="label" className={styles.filterSectionLabel}>
            Богатая нутриентом
          </Text>
          {!selectedNutrientLabel ? (
            <button
              type="button"
              className={styles.nutrientPickRow}
              onClick={onOpenNutrientPicker}
            >
              <NutrientIcon />
              <Text as="span" role="label">
                Выбрать нутриент
              </Text>
            </button>
          ) : (
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
      )}
    </div>
  );

  return (
    // One common bar = the component root. The back button sits OUTSIDE to the left,
    // the search field rides inside a single pill, and filtering/sorting hide behind a
    // sliders button (popover) on the right. In dishes-only mode there's no filter, so
    // a static serif title stands beside the pill and the filter button is absent.
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
      </div>

      {showFilterButton && (
        // Рельс шириной с info-колонку рядов (.infoBtn 56px) — кнопка-фильтр
        // центрируется ТОЧНО над столбцом ⓘ list-items (запрос юзера: фильтр в
        // один ряд с ⓘ). Сама кнопка 48px под «назад».
        <div className={styles.filterRail}>
          <PopoverTrigger
            placement="bottom-end"
            trigger={
              <IconButton
                tone="neutral"
                size={48}
                className={clsx(styles.filterButton, filterActive && styles.filterButtonActive)}
                aria-label="Фильтры поиска"
                title="Фильтры"
                icon={<FilterIcon width={20} height={20} />}
              />
            }
            content={filterPanel}
          />
        </div>
      )}
    </div>
  );
};

export default SearchFoodControls;

import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';
import { Text, Heading } from '@/shared/ui/atoms/Typography';
import { Button, IconButton } from '@/shared/ui/atoms/Button';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';
import type { SearchFilter } from '../SearchFood';
import { FILTER_LABELS, FILTER_HINTS } from '../searchFilterLabels';

import SearchIcon from '@/shared/assets/icons/lupa.svg?react';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import NutrientIcon from '@/shared/assets/icons/chart-bars.svg?react';
import FilterIcon from '@/shared/assets/icons/filter-icon.svg?react';

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
  inputId?: string;
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
  inputId,
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
  const filterPanel = (close: () => void) => (
    <div className={styles.filterPanel}>
      {/* Ряд-шапка панели: заголовок абсолютом ПО ЦЕНТРУ полосы (= центр экрана,
          панель full-bleed), крестик у правого края под кнопкой-фильтром. ✕ tone=
          "ghost" — голый глиф БЕЗ подложки-плитки (просьба 2026-07-12): в лёгкой
          панели крестик читается штрихом, а не кнопкой. */}
      <div className={styles.filterPanelHeader}>
        <Heading role="title" as="h2" className={styles.filterPanelTitle}>
          Фильтры
        </Heading>
        <IconButton
          tone="ghost"
          size={40}
          className={styles.filterCloseButton}
          aria-label="Закрыть фильтры"
          title="Закрыть"
          icon={<CrossIcon width={16} height={16} />}
          onClick={close}
        />
      </div>

      {hasFilter && filterOptions && (
        <div className={styles.filterSection}>
          <ChoiceGroup
            onSurface={1}
            value={selectedFilter}
            onChange={(next) => onSelectFilter?.(next as SearchFilter)}
            aria-label="Фильтр поиска"
            className={styles.filterChoices}
          >
            {filterOptions.map((opt) => (
              <ChoiceItem key={opt} value={opt} stacked className={styles.filterChoiceCell}>
                <Text as="span" role="label" className={styles.filterChoiceTitle}>
                  {FILTER_LABELS[opt]}
                </Text>
                <Text as="span" role="caption" className={styles.filterChoiceHint}>
                  {FILTER_HINTS[opt]}
                </Text>
              </ChoiceItem>
            ))}
          </ChoiceGroup>
        </div>
      )}

      {showNutrientFilter && (
        <div className={styles.filterSection}>
          {!selectedNutrientLabel ? (
            <Button
              onSurface={1}
              fullWidth
              icon={<NutrientIcon />}
              trailingChevron
              onClick={onOpenNutrientPicker}
            >
              По нутриентам
            </Button>
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
    // One common bar = the component root. Back button + title now live in the
    // persistent ModalHeader above (SearchFood); this bar carries ONLY the search
    // field (in a single pill) + the filtering/sorting sliders button (popover) on
    // the right. Bar scrolls away with the list; the ModalHeader stays put.
    <div className={clsx(styles.bar, className)}>
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
        // один ряд с ⓘ). Сама кнопка 40px — совпадает с back-кнопкой шапки и
        // видимым кружком ⓘ (56px-слот, inset 8px → ~40px). Была 48px — «пухла».
        <div className={styles.filterRail}>
          <PopoverTrigger
            placement="bottom-end"
            overlapTrigger
            surface={1}
            trigger={
              <IconButton
                tone="soft"
                size={40}
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

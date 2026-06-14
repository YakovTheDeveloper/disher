import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { FoodActionCard } from './food-action-card';
import { SearchFoodControls } from '@/features/food/food-search/SearchFoodControls';
import {
  allNutrientsList,
  defaultDailyNorms,
  nutrientsHaveDailyNorm,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useUserNormItems } from '@/entities/daily-norm';
import { drawerStore } from '@/shared/ui/drawer-store';
import { NutrientPickerDrawer } from './NutrientPickerDrawer';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';
import { useFilteredFoods, useFoodCreation, useRichNutrientStore } from './model';
import { FoodSearchEmpty } from './FoodSearchEmpty';

export type SearchMode = 'products-only' | 'dishes-only' | 'products-and-dishes';
export type SearchFilter = 'all' | 'mine';

const FILTER_OPTIONS_BY_MODE: Record<SearchMode, readonly SearchFilter[] | null> = {
  'dishes-only': null,
  'products-only': ['all', 'mine'],
  'products-and-dishes': ['all', 'mine'],
};

export const FILTER_LABELS: Record<SearchFilter, string> = {
  all: 'Всё',
  mine: 'Мое',
};

type SelectFoodPayload = { variant: 'product' | 'dish'; id: string; name: string };

type Props = {
  onSelectFood: (payload: SelectFoodPayload) => void;
  mode: SearchMode;
  activeItemId?: string | null;
  onInfoClick?: (variant: 'product' | 'dish', id: string) => void;
  onBack?: () => void;
  /**
   * Когда задан — в верхней строке рядом с полем поиска встаёт заголовок
   * (serif italic). Стрелка «назад» (`onBack`) — слева от него. Заголовок
   * и поиск живут в одном баре `SearchFoodControls`.
   *
   * Если `mode` допускает фильтр (не `dishes-only`), статический title
   * игнорируется — вместо него рендерится кликабельный селект.
   */
  title?: string;
  bottomLeft?: React.ReactNode;
  itemHtmlFor?: string;
  inputId?: string;
  initialSearchQuery?: string;
  isActive?: boolean;
  /**
   * When provided, the empty-state "create product/dish" actions become
   * <label htmlFor={createInputHtmlFor}> instead of standalone buttons, and
   * onPickCreate is invoked on click with the current search query as the
   * proposed name. The host can stash {variant, name} into its draft and let
   * onFocusCapture flip the step to the create modal.
   */
  createInputHtmlFor?: string;
  onPickCreate?: (variant: 'product' | 'dish', name: string) => void;
};

// Outer component: ALWAYS renders the <input id={inputId}> via SearchFoodControls so
// the <label htmlFor> → input focus delegation keeps working on iOS, even when this
// step is not the active one. Heavy work (Fuse indexes over the catalog, list rendering)
// lives in <SearchFoodHeavy> which is mounted one frame after isActive flips to true —
// letting the modal frame paint first instead of blocking on ~400 cards.
const SearchFood = ({
  onSelectFood,
  mode = 'products-and-dishes',
  activeItemId,
  onInfoClick,
  onBack,
  title,
  bottomLeft,
  itemHtmlFor,
  inputId,
  initialSearchQuery,
  isActive = true,
  createInputHtmlFor,
  onPickCreate,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
  const [showHeavy, setShowHeavy] = useState(false);
  const [openTicket, setOpenTicket] = useState(0);

  // Парящая шапка лежит поверх списка (см. .header в SearchFood.module.scss).
  // Меряем её реальную высоту (меняется, когда появляется ряд «Нутриенты») и
  // кладём в --search-header-h → список берёт её в padding-top. Так офсет точный
  // и без магической константы.
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    const content = contentRef.current;
    if (!header || !content) return;
    const ro = new ResizeObserver(() => {
      content.style.setProperty('--search-header-h', `${header.offsetHeight}px`);
    });
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  const filterOptions = FILTER_OPTIONS_BY_MODE[mode];
  const [selectedFilter, setSelectedFilter] = useState<SearchFilter>('all');

  // Выбранный нутриент для фильтра «Еда богатая нутриентом» — в сторе (не useState),
  // чтобы переживать remount SearchFood (консумеры рендерят `key={sessionKey}` и
  // бампают key после каждого добавления). Держится, пока юзер сам не снимет
  // крестиком. Не персистим. Стор же делает orphan-drawer гонку безобидной: выбор
  // из «осиротевшего» пикера просто пишется в стор, который читает текущий инстанс.
  const richNutrient = useRichNutrientStore((s) => s.richNutrient);
  const setRichNutrient = useRichNutrientStore((s) => s.setRichNutrient);
  const clearRichNutrient = useRichNutrientStore((s) => s.clearRichNutrient);

  const richNutrientName = useMemo(
    () =>
      richNutrient
        ? (allNutrientsList.find((n) => n.id === richNutrient.id)?.displayNameRu ?? null)
        : null,
    [richNutrient]
  );

  const handleOpenNutrientPicker = useCallback(async () => {
    const picked = await drawerStore.show(
      NutrientPickerDrawer,
      { activeId: richNutrient?.id },
      { side: 'left', width: 'min(85vw, 360px)' }
    );
    if (picked) setRichNutrient(picked);
  }, [setRichNutrient, richNutrient?.id]);

  useEffect(() => {
    if (!isActive) {
      setShowHeavy(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      setOpenTicket((t) => t + 1);
      setShowHeavy(true);
    });
    return () => cancelAnimationFrame(id);
  }, [isActive]);

  const handleSelectFood = useCallback(
    (payload: SelectFoodPayload) => {
      onSelectFood(payload);
      // (б): после выбора элемента селект моргает обратно в «Еда». В большинстве
      // флоу SearchFood в этот момент уже размонтируется (step переключается) и
      // ресет невидим, но это защита для сценариев где он остаётся открытым.
      if (filterOptions) setSelectedFilter('all');
    },
    [onSelectFood, filterOptions]
  );

  return (
    <div className={styles.content} ref={contentRef}>
      {/* Ambient glow (top + bottom) — the one place a faint colour hint is
          allowed on this otherwise monochrome screen. Sits behind everything. */}
      <div className={styles.ambient} aria-hidden />
      <div className={styles.header} ref={headerRef}>
        <SearchFoodControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBack={onBack}
          title={title}
          inputId={inputId}
          filterOptions={filterOptions ?? undefined}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          showNutrientFilter={mode !== 'dishes-only'}
          selectedNutrientLabel={richNutrientName}
          onOpenNutrientPicker={handleOpenNutrientPicker}
          onClearNutrient={clearRichNutrient}
        />
      </div>

      {showHeavy && (
        <div key={openTicket} className={styles.heavyFade}>
          <SearchFoodHeavy
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            mode={mode}
            selectedFilter={selectedFilter}
            activeItemId={activeItemId}
            richNutrient={richNutrient}
            onInfoClick={onInfoClick}
            onSelectFood={handleSelectFood}
            bottomLeft={bottomLeft}
            itemHtmlFor={itemHtmlFor}
            createInputHtmlFor={createInputHtmlFor}
            onPickCreate={onPickCreate}
          />
        </div>
      )}
    </div>
  );
};

type HeavyProps = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  mode: SearchMode;
  selectedFilter: SearchFilter;
  activeItemId?: string | null;
  richNutrient?: { id: string; unit: string } | null;
  onInfoClick?: (variant: 'product' | 'dish', id: string) => void;
  onSelectFood: (payload: SelectFoodPayload) => void;
  bottomLeft?: React.ReactNode;
  itemHtmlFor?: string;
  createInputHtmlFor?: string;
  onPickCreate?: (variant: 'product' | 'dish', name: string) => void;
};

const SearchFoodHeavy = ({
  searchQuery,
  setSearchQuery,
  mode,
  selectedFilter,
  activeItemId,
  richNutrient,
  onInfoClick,
  onSelectFood,
  bottomLeft,
  itemHtmlFor,
  createInputHtmlFor,
  onPickCreate,
}: HeavyProps) => {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const { sentinelRef, hasMoreBelow } = useScrollBottomIndicator(listContainerRef);
  const isProgrammaticScrollRef = useRef(false);

  const userOnlyProducts = selectedFilter === 'mine';
  const { products, dishes, nutrientMap } = useFilteredFoods(
    searchQuery,
    richNutrient?.id,
    userOnlyProducts
  );
  const { handleCreateProduct, handleCreateDish } = useFoodCreation(searchQuery, setSearchQuery);

  // mode задаёт глобальный скоуп, selectedFilter сужает дальше:
  //   'all'  → не сужает; catalog + user-products + (dishes если mode)
  //   'mine' → только user-products + (dishes если mode); catalog скрыт
  //            (catalog-фильтрация делается в useFilteredFoods через userOnlyProducts)
  const showProductsByMode = mode !== 'dishes-only';
  const showDishesByMode = mode !== 'products-only';
  const showProducts = showProductsByMode;
  const showDishes = showDishesByMode;
  const totalItems = (showProducts ? products.length : 0) + (showDishes ? dishes.length : 0);

  // Scroll to top when items change (search)
  useEffect(() => {
    isProgrammaticScrollRef.current = true;
    listContainerRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, [totalItems]);

  // Blur keyboard on user scroll (mobile UX)
  const handleListScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      active.blur();
    }
  }, []);

  // Compute max nutrient value across all products for richness bar scaling
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- результат примитив (number); референсная стабильность не важна, компилятор мемоизирует сам
  const richNutrientMax = useMemo(() => {
    if (!richNutrient?.id || nutrientMap.size === 0) return 0;
    let max = 0;
    for (const entries of nutrientMap.values()) {
      const val = entries.find((n) => n.nutrientId === richNutrient.id)?.quantity ?? 0;
      if (val > max) max = val;
    }
    return max;
  }, [richNutrient?.id, nutrientMap]);

  // Суточная норма выбранного нутриента (user-норма ?? дефолт). Считаем один раз
  // и прокидываем числом в каждую карточку, чтобы не дёргать хук в ~400 строках.
  // undefined у нутриентов без нормы → карточка покажет абсолютное значение.
  const userNormItems = useUserNormItems();
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- результат примитив (number | undefined); компилятор мемоизирует сам
  const richNutrientNorm = useMemo(() => {
    if (!richNutrient?.id) return undefined;
    // «нет официальной нормы» (сахар/крахмал/каротины) → % не считаем, остаётся
    // абсолютное значение. nutrientsHaveDailyNorm — канонический флаг (был мёртвый,
    // теперь подключён здесь и в useNutrientCard).
    if (nutrientsHaveDailyNorm[+richNutrient.id] !== true) return undefined;
    return userNormItems?.[richNutrient.id] ?? defaultDailyNorms[+richNutrient.id];
  }, [richNutrient?.id, userNormItems]);

  const onFoodAdd = useCallback(
    (item: { id: string; name: string }) =>
      onSelectFood({ variant: 'product', id: item.id, name: item.name }),
    [onSelectFood]
  );
  const onDishAdd = useCallback(
    (item: { id: string; name: string }) =>
      onSelectFood({ variant: 'dish', id: item.id, name: item.name }),
    [onSelectFood]
  );

  const trimmedQuery = searchQuery.trim();
  const isSearchActive = trimmedQuery.length >= 2;

  const visibleHasResults =
    (showProducts && products.length > 0) || (showDishes && dishes.length > 0);

  // When the host provides onPickCreate + createInputHtmlFor, the empty-state
  // actions delegate to a create-name modal via <label htmlFor> focus. Otherwise
  // fall back to the legacy toaster-based useFoodCreation flow.
  const productHandler = onPickCreate
    ? () => onPickCreate('product', trimmedQuery)
    : handleCreateProduct;
  const dishHandler = onPickCreate ? () => onPickCreate('dish', trimmedQuery) : handleCreateDish;

  const createButtons = (
    <FoodSearchEmpty
      query={trimmedQuery}
      onCreateProduct={showProducts ? productHandler : undefined}
      onCreateDish={showDishes ? dishHandler : undefined}
      showMessage={isSearchActive && !visibleHasResults}
      createInputHtmlFor={createInputHtmlFor}
    />
  );

  const renderProductItem = useCallback(
    (item: (typeof products)[number]) => {
      const itemWithNutrients = richNutrient?.id
        ? {
            ...item,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            getTotalNutrients: (_qty: number) => {
              const entries = nutrientMap.get(item.id);
              if (!entries) return {};
              const result: Record<string, number> = {};
              for (const e of entries) result[e.nutrientId] = e.quantity;
              return result;
            },
          }
        : item;
      return (
        <FoodActionCard
          key={item.id}
          variant="product"
          item={itemWithNutrients}
          active={activeItemId === item.id}
          onClick={() => onFoodAdd(item)}
          onInfoClick={onInfoClick ? () => onInfoClick('product', item.id) : undefined}
          richNutrientId={richNutrient?.id}
          richNutrientUnit={richNutrient?.unit}
          richNutrientMax={richNutrientMax}
          richNutrientNorm={richNutrientNorm}
          htmlFor={itemHtmlFor}
        />
      );
    },
    [
      activeItemId,
      onFoodAdd,
      onInfoClick,
      richNutrient,
      nutrientMap,
      richNutrientMax,
      richNutrientNorm,
      itemHtmlFor,
    ]
  );

  const renderDishItem = useCallback(
    (item: (typeof dishes)[number]) => (
      <FoodActionCard
        key={item.id}
        variant="dish"
        item={item}
        active={activeItemId === item.id}
        onClick={() => onDishAdd(item)}
        onInfoClick={onInfoClick ? () => onInfoClick('dish', item.id) : undefined}
        htmlFor={itemHtmlFor}
      />
    ),
    [activeItemId, onDishAdd, onInfoClick, itemHtmlFor]
  );

  return (
    <>
      <div
        ref={listContainerRef}
        className={clsx(styles.listContainer, styles.listContainerOffset)}
        onScroll={handleListScroll}
        role="listbox"
      >
        {showProducts && <ul className={styles.list}>{products.map(renderProductItem)}</ul>}
        {showDishes && <ul className={styles.list}>{dishes.map(renderDishItem)}</ul>}
        <div ref={sentinelRef} />
      </div>
      {/* При выбранном нутриенте поиск = режим фильтра по богатству; create-пустышку прячем. */}
      {!richNutrient && createButtons}
      <ScrollIndicator visible={hasMoreBelow} variant="dark" />

      {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}
    </>
  );
};

export default SearchFood;

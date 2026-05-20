import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { FoodActionCard } from './food-action-card';
import { SearchFoodControls } from '@/features/food/food-search/SearchFoodControls';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { useFilteredFoods, useFoodCreation } from './model';
import { FoodSearchEmpty } from './FoodSearchEmpty';

const SEARCH_FOOD_VARIANTS = [
  'baseline',
  'column-stripe',
  'stripe-warm',
  'stripe-mint',
  'stripe-rose',
  'stripe-graphite',
  'stripe-sand',
  'stripe-lavender',
] as const;

export type SearchMode = 'products-only' | 'dishes-only' | 'products-and-dishes';

type SelectFoodPayload = { variant: 'product' | 'dish'; id: string; name: string };

type Props = {
  onSelectFood: (payload: SelectFoodPayload) => void;
  mode: SearchMode;
  activeItemId?: string | null;
  richNutrient?: { id: string; unit: string } | null;
  onInfoClick?: (variant: 'product' | 'dish', id: string) => void;
  onBack?: () => void;
  /**
   * Когда задан — в верхней строке рядом с полем поиска встаёт заголовок
   * (serif italic). Стрелка «назад» (`onBack`) — слева от него. Заголовок
   * и поиск живут в одном баре `SearchFoodControls`.
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
  richNutrient,
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
  const { anchor } = useDesignVariant('SearchFood', SEARCH_FOOD_VARIANTS);

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

  return (
    <div className={styles.content} {...anchor}>
      <div className={styles.header}>
        <SearchFoodControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBack={onBack}
          title={title}
          inputId={inputId}
        />
      </div>

      {showHeavy && (
        <div key={openTicket} className={styles.heavyFade}>
          <SearchFoodHeavy
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            mode={mode}
            activeItemId={activeItemId}
            richNutrient={richNutrient}
            onInfoClick={onInfoClick}
            onSelectFood={onSelectFood}
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

  const { products, dishes, nutrientMap } = useFilteredFoods(searchQuery, richNutrient?.id);
  const { handleCreateProduct, handleCreateDish } = useFoodCreation(searchQuery, setSearchQuery);

  const showProducts = mode !== 'dishes-only';
  const showDishes = mode !== 'products-only';
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

  const richNutrientInfo = useMemo(
    () => (richNutrient ? allNutrientsList.find((n) => n.id === richNutrient.id) : null),
    [richNutrient]
  );

  // Compute max nutrient value across all products for richness bar scaling
  const richNutrientMax = useMemo(() => {
    if (!richNutrient?.id || nutrientMap.size === 0) return 0;
    let max = 0;
    for (const entries of nutrientMap.values()) {
      const val = entries.find((n) => n.nutrientId === richNutrient.id)?.quantity ?? 0;
      if (val > max) max = val;
    }
    return max;
  }, [richNutrient?.id, nutrientMap]);

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
  const dishHandler = onPickCreate
    ? () => onPickCreate('dish', trimmedQuery)
    : handleCreateDish;

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
          htmlFor={itemHtmlFor}
        />
      );
    },
    [activeItemId, onFoodAdd, onInfoClick, richNutrient, nutrientMap, richNutrientMax, itemHtmlFor]
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
      {richNutrientInfo && (
        <div className={styles.filterMessage}>
          Богатые по <strong>{richNutrientInfo.displayNameRu}</strong>
        </div>
      )}
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
      {createButtons}
      <ScrollIndicator visible={hasMoreBelow} variant="dark" />

      {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}
    </>
  );
};

export default SearchFood;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { FoodActionCard } from './food-action-card';
import { FilterPanel } from './FilterPanel';
import { SearchFoodControls } from '@/features/food/food-search/SearchFoodControls';
import { FilterButton } from '@/shared/ui/atoms/Button';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { getProductCategoryGroups, getProductCategoryOptions } from '@/entities/product';
import { useScrollBottomIndicator } from '@/hooks/useScrollBottomIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';
import { useFilteredFoods, useFoodCreation } from './model';
import { FoodSearchEmpty } from './FoodSearchEmpty';

export type SearchMode = 'products-only' | 'dishes-only' | 'products-and-dishes';

type SelectFoodPayload = { variant: 'product' | 'dish'; id: string; name: string };

type Props = {
  onSelectFood: (payload: SelectFoodPayload) => void;
  mode: SearchMode;
  activeItemId?: string | null;
  richNutrient?: { id: string; unit: string } | null;
  onInfoClick?: (variant: 'product' | 'dish', id: string) => void;
  onBack?: () => void;
  bottomLeft?: React.ReactNode;
  itemHtmlFor?: string;
  inputId?: string;
  initialSearchQuery?: string;
  isActive?: boolean;
};

const getDefaultTab = (mode: SearchMode) => (mode === 'dishes-only' ? 'блюда' : 'все');

// Outer component: ALWAYS renders the <input id={inputId}> via SearchFoodControls so
// the <label htmlFor> → input focus delegation keeps working on iOS, even when this
// step is not the active one. Heavy work (PowerSync queries, list rendering, FilterPanel)
// lives in <SearchFoodHeavy> which is conditionally mounted via {isActive && ...}.
// See feedback_ios_focus.md for why the input must stay in the DOM in the same node.
const SearchFood = ({
  onSelectFood,
  mode = 'products-and-dishes',
  activeItemId,
  richNutrient,
  onInfoClick,
  onBack,
  bottomLeft,
  itemHtmlFor,
  inputId,
  initialSearchQuery,
  isActive = true,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
  const [currentTab, setCurrentTab] = useState(getDefaultTab(mode));

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <SearchFoodControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBack={onBack}
          inputId={inputId}
        />
      </div>

      {isActive && (
        <SearchFoodHeavy
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          mode={mode}
          activeItemId={activeItemId}
          richNutrient={richNutrient}
          onInfoClick={onInfoClick}
          onSelectFood={onSelectFood}
          bottomLeft={bottomLeft}
          itemHtmlFor={itemHtmlFor}
        />
      )}
    </div>
  );
};

type HeavyProps = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentTab: string;
  setCurrentTab: (t: string) => void;
  mode: SearchMode;
  activeItemId?: string | null;
  richNutrient?: { id: string; unit: string } | null;
  onInfoClick?: (variant: 'product' | 'dish', id: string) => void;
  onSelectFood: (payload: SelectFoodPayload) => void;
  bottomLeft?: React.ReactNode;
  itemHtmlFor?: string;
};

const SearchFoodHeavy = ({
  searchQuery,
  setSearchQuery,
  currentTab,
  setCurrentTab,
  mode,
  activeItemId,
  richNutrient,
  onInfoClick,
  onSelectFood,
  bottomLeft,
  itemHtmlFor,
}: HeavyProps) => {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [myFoodOnly, setMyFoodOnly] = useState(false);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const { sentinelRef, hasMoreBelow } = useScrollBottomIndicator(listContainerRef);
  const isProgrammaticScrollRef = useRef(false);

  const { products, dishes, categoryFilter, nutrientMap } = useFilteredFoods(
    searchQuery,
    myFoodOnly,
    richNutrient?.id
  );
  const { handleCreateProduct, handleCreateDish } = useFoodCreation(searchQuery, setSearchQuery);

  const totalItems = products.length + dishes.length;

  // Scroll to top when items change (search/filter)
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

  const isSearchActive = searchQuery.trim().length >= 2;
  const trimmedQuery = searchQuery.trim();

  const showProducts = mode !== 'dishes-only';
  const showDishes = mode !== 'products-only';

  const bothListsVisible = currentTab === 'все';
  const visibleHasResults =
    (currentTab === 'продукты' && products.length > 0) ||
    (currentTab === 'блюда' && dishes.length > 0) ||
    (bothListsVisible && (products.length > 0 || dishes.length > 0)) ||
    (mode === 'dishes-only' && dishes.length > 0);

  const createButtons = isSearchActive ? (
    <FoodSearchEmpty
      query={trimmedQuery}
      onCreateProduct={showProducts ? handleCreateProduct : undefined}
      onCreateDish={showDishes ? handleCreateDish : undefined}
      showMessage={!visibleHasResults}
    />
  ) : null;

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
        {(currentTab === 'продукты' || currentTab === 'все') && (
          <ul className={styles.list}>{products.map(renderProductItem)}</ul>
        )}
        {(currentTab === 'блюда' || currentTab === 'все' || mode === 'dishes-only') && (
          <ul className={styles.list}>{dishes.map(renderDishItem)}</ul>
        )}
        <div ref={sentinelRef} />
      </div>
      {createButtons}
      <ScrollIndicator visible={hasMoreBelow} variant="dark" />

      <section
        className={clsx(styles.filterWrapper, !filterPanelOpen && styles.filterWrapper_hidden)}
      >
        <FilterPanel
          isOpen={filterPanelOpen}
          header={
            <>
              {mode === 'products-and-dishes' && (
                <div className={styles.tabBar}>
                  <button
                    className={clsx(
                      styles.tabBarItem,
                      currentTab === 'все' && styles.tabBarItem_active
                    )}
                    onClick={() => setCurrentTab('все')}
                  >
                    Все
                  </button>
                  <button
                    className={clsx(
                      styles.tabBarItem,
                      currentTab === 'продукты' && styles.tabBarItem_active
                    )}
                    onClick={() => setCurrentTab('продукты')}
                  >
                    Продукты
                  </button>
                  <button
                    className={clsx(
                      styles.tabBarItem,
                      currentTab === 'блюда' && styles.tabBarItem_active
                    )}
                    onClick={() => setCurrentTab('блюда')}
                  >
                    Блюда
                  </button>
                </div>
              )}
              <div className={styles.filterChips}>
                <button
                  className={clsx(styles.filterChip, myFoodOnly && styles.filterChipActive)}
                  onClick={() => setMyFoodOnly((prev) => !prev)}
                >
                  Моя еда
                </button>
              </div>
            </>
          }
          groups={getProductCategoryGroups()}
          options={getProductCategoryOptions()}
          selectedValues={categoryFilter.selectedCategories}
          onToggle={(value) => categoryFilter.toggleCategory(value as string)}
          onClear={() => categoryFilter.clearCategories()}
          title="Фильтр по категории"
        />
      </section>

      {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}

      <div className={styles.filterButtonWrapper}>
        <FilterButton
          isActive={filterPanelOpen}
          onClick={() => setFilterPanelOpen((p) => !p)}
          activeCount={categoryFilter.selectedCategories.length + (myFoodOnly ? 1 : 0)}
        >
          Фильтр
        </FilterButton>
      </div>
    </>
  );
};

export default SearchFood;

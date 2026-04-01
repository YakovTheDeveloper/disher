import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { FoodActionCard } from './food-action-card';
import { FilterPanel } from './FilterPanel';
import { SearchFoodControls } from '@/features/food/food-search/SearchFoodControls';
import { FilterButton } from '@/shared/ui/atoms/Button';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { getProductCategoryGroups, getProductCategoryOptions } from '@/entities/product';
import { getDishCategoryGroups, getDishCategoryOptions } from '@/entities/dish';
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
  searchBarLeftChild?: React.ReactNode;
  searchBarRightChild?: React.ReactNode;
  itemHtmlFor?: string;
  inputId?: string;
};

const getDefaultTab = (mode: SearchMode) => (mode === 'dishes-only' ? 'блюда' : 'все');

const SearchFood = ({
  onSelectFood,
  mode = 'products-and-dishes',
  activeItemId,
  richNutrient,
  onInfoClick,
  onBack,
  searchBarLeftChild,
  searchBarRightChild,
  itemHtmlFor,
  inputId,
}: Props) => {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [myFoodOnly, setMyFoodOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(getDefaultTab(mode));

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

  const currentFilterType = currentTab === 'блюда' ? 'dish' : 'product';

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

  const emptyContent = isSearchActive ? (
    <FoodSearchEmpty
      query={trimmedQuery}
      onCreateProduct={showProducts ? handleCreateProduct : undefined}
      onCreateDish={showDishes ? handleCreateDish : undefined}
    />
  ) : undefined;

  // When tab is "все", both lists render — avoid showing emptyContent twice.
  // Show it only once: outside the lists when both are empty, or inside the single non-empty list otherwise.
  const bothListsVisible = currentTab === 'все';
  const bothEmpty = bothListsVisible && products.length === 0 && dishes.length === 0;

  const renderProductItem = useCallback(
    (item: (typeof products)[number]) => {
      const itemWithNutrients = richNutrient?.id
        ? {
            ...item,
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
          variant="product"
          item={itemWithNutrients}
          active={activeItemId === item.id}
          onClick={() => onFoodAdd(item)}
          onInfoClick={onInfoClick ? () => onInfoClick('product', item.id) : undefined}
          richNutrientId={richNutrient?.id}
          richNutrientUnit={richNutrient?.unit}
          richNutrientMax={richNutrientMax}
        />
      );
    },
    [activeItemId, onFoodAdd, onInfoClick, richNutrient, nutrientMap, richNutrientMax]
  );

  const renderDishItem = useCallback(
    (item: (typeof dishes)[number]) => (
      <FoodActionCard
        variant="dish"
        item={item}
        active={activeItemId === item.id}
        onClick={() => onDishAdd(item)}
        onInfoClick={onInfoClick ? () => onInfoClick('dish', item.id) : undefined}
      />
    ),
    [activeItemId, onDishAdd, onInfoClick]
  );

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <SearchFoodControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onBack={onBack}
          searchBarLeftChild={searchBarLeftChild}
          searchBarRightChild={searchBarRightChild}
          inputId={inputId}
        />
      </div>

      {richNutrientInfo && (
        <div className={styles.filterMessage}>
          Богатые по <strong>{richNutrientInfo.displayNameRu}</strong>
        </div>
      )}
      {bothEmpty && emptyContent}

      <div
        ref={listContainerRef}
        className={styles.listContainer}
        onScroll={handleListScroll}
        role="listbox"
      >
        {(currentTab === 'продукты' || currentTab === 'все') && (
          <>
            {products.length === 0 && !bothListsVisible && emptyContent}
            <ul className={styles.list}>
              {products.map((item) => {
                const Tag = itemHtmlFor ? 'label' : 'div';
                return (
                  <Tag key={item.id} htmlFor={itemHtmlFor} role="option">
                    {renderProductItem(item)}
                  </Tag>
                );
              })}
            </ul>
          </>
        )}
        {(currentTab === 'блюда' || currentTab === 'все' || mode === 'dishes-only') && (
          <>
            {dishes.length === 0 && !bothListsVisible && emptyContent}
            <ul className={styles.list}>
              {dishes.map((item) => {
                const Tag = itemHtmlFor ? 'label' : 'div';
                return (
                  <Tag key={item.id} htmlFor={itemHtmlFor} role="option">
                    {renderDishItem(item)}
                  </Tag>
                );
              })}
            </ul>
          </>
        )}
        <div ref={sentinelRef} />
      </div>
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
              {currentTab === 'продукты' && (
                <div className={styles.filterChips}>
                  <button
                    className={clsx(styles.filterChip, myFoodOnly && styles.filterChipActive)}
                    onClick={() => setMyFoodOnly((prev) => !prev)}
                  >
                    Моя еда
                  </button>
                </div>
              )}
            </>
          }
          groups={currentTab === 'продукты' ? getProductCategoryGroups() : getDishCategoryGroups()}
          options={
            currentTab === 'продукты' ? getProductCategoryOptions() : getDishCategoryOptions()
          }
          selectedValues={categoryFilter.getCategoryFilter(currentFilterType)}
          onToggle={(value) => categoryFilter.toggleCategory(currentFilterType, value as string)}
          onClear={() => categoryFilter.clearCategories(currentFilterType)}
          title="Фильтр по категории"
        />
      </section>

      <div className={styles.filterButtonWrapper}>
        <FilterButton
          isActive={filterPanelOpen}
          onClick={() => setFilterPanelOpen((p) => !p)}
          activeCount={
            categoryFilter.getCategoryFilter('product').length +
            categoryFilter.getCategoryFilter('dish').length +
            (myFoodOnly ? 1 : 0)
          }
        >
          Фильтр
        </FilterButton>
      </div>
    </div>
  );
};

export default SearchFood;

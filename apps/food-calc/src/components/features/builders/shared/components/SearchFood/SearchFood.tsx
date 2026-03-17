import { List } from '@/components/features/builders/shared/ContentEdit/Food/List';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { domainStore } from '@/store/store';
import { FoodActionCard } from '@/components/features/food/food-action-card';
import { useFilteringStateV2 } from '@/components/features/shared/hooks/useFilteringStateV2';
import { useCategoryFilterState } from '@/components/features/shared/hooks/useCategoryFilterState';
import { SearchFoodControls } from '@/components/features/builders/shared/components/SearchFood/SearchFoodControls';
import { FilterButton } from '@/components/ui/atoms/Button';
import { FilterPanel } from '@/components/ui/FilterPanel';
import {
  getDishCategoryGroups,
  getProductCategoryGroups,
  getDishCategoryOptions,
  getProductCategoryOptions,
} from '@/lib/filter/categoryOptions';
import { productFactory } from '@/domain/product/Food.factory';
import { DishFactory } from '@/store/DishStore/Dish.factory';
import toaster from '@/infrastructure/toaster/toaster';
import { allNutrientsList } from '@/components/entities/nutrient/NutrientGroup/constants';

export type SearchMode = 'products-only' | 'dishes-only' | 'products-and-dishes';

type Props = {
  currentProductId?: string | null;
  currentDishId?: string | null;
  onFinish: (payload: { variant: 'product' | 'dish'; id: string }) => void;
  onFocusChange?: (focused: boolean) => void;
  onOpen?: () => void;
  mode: SearchMode;
  showInfoButtonOnListItem?: boolean;
  actionLeft?: React.ReactNode;
  actionRight?: React.ReactNode;
  sortByNutrientId?: string | null;
  sortByNutrientUnit?: string;
  showMore?: boolean;
};

const SearchFood = ({
  onFinish,
  currentProductId,
  currentDishId,
  onFocusChange,
  mode = 'products-and-dishes',
  showInfoButtonOnListItem = false,
  actionLeft,
  actionRight,
  sortByNutrientId,
  sortByNutrientUnit,
  showMore = false,
}: Props) => {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [myFoodOnly, setMyFoodOnly] = useState(false);

  // Category filter state
  const categoryFilter = useCategoryFilterState();

  // Determine current filter type based on tab
  const getCurrentFilterType = (tab: string) => (tab === 'продукты' ? 'product' : 'dish');

  // Логика фильтрации - создаётся внутри компонента
  const filterKeys = ['name'] as const;

  // Initialize with default tab based on mode
  const getDefaultTab = (searchMode: SearchMode) => {
    switch (searchMode) {
      case 'products-only':
        return 'продукты';
      case 'dishes-only':
        return 'блюда';
      case 'products-and-dishes':
      default:
        return 'продукты';
    }
  };

  const richNutrient = useMemo(
    () => (sortByNutrientId ? allNutrientsList.find((n) => n.id === sortByNutrientId) : null),
    [sortByNutrientId]
  );

  const sortedProducts = useMemo(() => {
    const products = myFoodOnly
      ? domainStore.foodStore.merged.filter((p) => p.createdByUser)
      : domainStore.foodStore.merged;
    if (!sortByNutrientId) return products;
    return [...products].sort((a: any, b: any) => {
      const aNutrients = a.getTotalNutrients?.(100) ?? {};
      const bNutrients = b.getTotalNutrients?.(100) ?? {};
      return (bNutrients[sortByNutrientId] ?? 0) - (aNutrients[sortByNutrientId] ?? 0);
    });
  }, [sortByNutrientId, myFoodOnly]);

  const maxNutrientValue = useMemo(() => {
    if (!sortByNutrientId || sortedProducts.length === 0) return 0;
    const first = sortedProducts[0];
    const nutrients = (first as { getTotalNutrients?: (qty: number) => Record<string, number> }).getTotalNutrients?.(100);
    return nutrients?.[sortByNutrientId] ?? 0;
  }, [sortByNutrientId, sortedProducts]);

  const tabs = [
    {
      tabName: 'продукты',
      list: sortedProducts,
      filterKeys,
    },
    {
      tabName: 'блюда',
      list: domainStore.dishStore.merged,
      filterKeys,
    },
  ] as const;

  // First pass to get current tab for category filter lookup
  const filterState = useFilteringStateV2(tabs, { defaultTab: getDefaultTab(mode) });

  const currentFilterType = getCurrentFilterType(filterState.currentTab);
  const currentCategoryFilter = categoryFilter.getCategoryFilter(currentFilterType);

  // Main filter state with category filter applied
  const filterStateWithCategory = useFilteringStateV2(tabs, {
    categoryFilter: currentCategoryFilter,
    defaultTab: getDefaultTab(mode),
  });

  const toggleFilterPanel = () => {
    setFilterPanelOpen((prev) => !prev);
  };

  const onFoodAdd = useCallback(
    (payload: any) => {
      const id = payload.id.toString();
      onFinish({
        variant: 'product',
        id,
      });
    },
    [onFinish]
  );

  const onDishAdd = useCallback(
    (payload: any) => {
      const id = payload.id.toString();

      onFinish({
        variant: 'dish',
        id,
      });
    },
    [onFinish]
  );

  const handleCreateProduct = useCallback(() => {
    const name = filterStateWithCategory.searchQuery.trim();
    if (!name) return;
    const product = productFactory.createNewLocal({
      name,
      nutrients: [],
      portions: [],
      description: '',
    });
    domainStore.foodStore.insert(product);
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: `/product/${product.id}` },
    });
  }, [filterStateWithCategory.searchQuery]);

  const handleCreateDish = useCallback(() => {
    const name = filterStateWithCategory.searchQuery.trim();
    if (!name) return;
    const dish = DishFactory.createNewLocal({ name, description: '', userId: 0 });
    domainStore.dishStore.insert(dish);
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: `/dish/${dish.id}` },
    });
  }, [filterStateWithCategory.searchQuery]);

  const searchQuery = filterStateWithCategory.searchQuery.trim();
  const isSearchActive = searchQuery.length >= 2;

  const productEmptyContent = isSearchActive ? (
    <button className={styles.createSuggestion} onClick={handleCreateProduct}>
      Ничего не нашлось — создать продукт «{searchQuery}»
    </button>
  ) : undefined;

  const dishEmptyContent = isSearchActive ? (
    <button className={styles.createSuggestion} onClick={handleCreateDish}>
      Ничего не нашлось — создать блюдо «{searchQuery}»
    </button>
  ) : undefined;

  const renderProductItem = useCallback(
    (item: any) => {
      return (
        <FoodActionCard
          variant="product"
          item={item}
          active={currentProductId === item.id.toString()}
          onClick={() => onFoodAdd(item)}
          onAdd={() => onFoodAdd(item)}
          showInfo={showInfoButtonOnListItem}
          showMore={showMore}
          richNutrientId={sortByNutrientId}
          richNutrientUnit={sortByNutrientUnit}
          richNutrientMax={maxNutrientValue}
        />
      );
    },
    [currentProductId, onFoodAdd, showInfoButtonOnListItem, showMore, sortByNutrientId, sortByNutrientUnit, maxNutrientValue]
  );

  const renderDishtItem = useCallback(
    (item: any) => {
      return (
        <FoodActionCard
          variant="dish"
          item={item}
          active={currentDishId === item.id.toString()}
          onClick={() => onDishAdd(item)}
          onAdd={() => onDishAdd(item)}
          showInfo={showInfoButtonOnListItem}
          showMore={showMore}
        />
      );
    },
    [currentDishId, onDishAdd, showInfoButtonOnListItem, showMore]
  );

  return (
    <>
      <div className={styles.content}>
        <div className={styles.header}>
          <SearchFoodControls
            searchState={filterStateWithCategory}
            onFocusChange={onFocusChange}
            toggleFilterPanel={toggleFilterPanel}
            mode={mode}
            actionLeft={actionLeft}
            actionRight={actionRight}
          />
        </div>

        {richNutrient && (
          <div className={styles.filterMessage}>
            Богатые по <strong>{richNutrient.displayNameRu}</strong>
          </div>
        )}

        {filterStateWithCategory.currentTab === 'продукты' && (
          <List
            isShow={true}
            after={null}
            queryKey="productSearch"
            onFetch={async () => ({ items: [], hasMore: false })}
            search={filterStateWithCategory}
            renderListContent={renderProductItem}
            emptyContent={productEmptyContent}
            onClose={() => {}}
          />
        )}
        {(filterStateWithCategory.currentTab === 'блюда' || mode === 'dishes-only') && (
          <List
            isShow={true}
            after={null}
            queryKey="dishSearch"
            onFetch={async () => ({ items: [], hasMore: false })}
            search={filterStateWithCategory}
            renderListContent={renderDishtItem}
            emptyContent={dishEmptyContent}
            onClose={() => {}}
          />
        )}

        {/* Filter Panel at bottom of screen */}
        <section
          className={clsx(styles.filterWrapper, !filterPanelOpen && styles.filterWrapper_hidden)}
        >
          {/* Tabs for switching between Products and Dishes */}
          <FilterPanel
            isOpen={filterPanelOpen}
            header={
              <div>
                {mode === 'products-and-dishes' && (
                  <div className={styles.filterTabs}>
                    <button
                      className={`${styles.filterTab} ${filterStateWithCategory.currentTab === 'продукты' ? styles.filterTabActive : ''}`}
                      onClick={() => filterStateWithCategory.setTab('продукты')}
                    >
                      Продукты
                    </button>
                    <button
                      className={`${styles.filterTab} ${filterStateWithCategory.currentTab === 'блюда' ? styles.filterTabActive : ''}`}
                      onClick={() => filterStateWithCategory.setTab('блюда')}
                    >
                      Блюда
                    </button>
                  </div>
                )}
                {filterStateWithCategory.currentTab === 'продукты' && (
                  <div className={styles.filterChips}>
                    <button
                      className={`${styles.filterChip} ${myFoodOnly ? styles.filterChipActive : ''}`}
                      onClick={() => setMyFoodOnly((prev) => !prev)}
                    >
                      Моя еда
                    </button>
                  </div>
                )}
              </div>
            }
            groups={
              filterStateWithCategory.currentTab === 'продукты'
                ? getProductCategoryGroups()
                : getDishCategoryGroups()
            }
            options={
              filterStateWithCategory.currentTab === 'продукты'
                ? getProductCategoryOptions()
                : getDishCategoryOptions()
            }
            selectedValues={currentCategoryFilter}
            onToggle={(value) => categoryFilter.toggleCategory(currentFilterType, value as string)}
            onClear={() => categoryFilter.clearCategories(currentFilterType)}
            title="Фильтр по категории"
          />
        </section>

        {/* Filter Button in bottom-right corner */}
        <div className={styles.filterButtonWrapper}>
          <FilterButton
            isActive={filterPanelOpen}
            onClick={toggleFilterPanel}
            activeCount={
              categoryFilter.getCategoryFilter('product').length +
              categoryFilter.getCategoryFilter('dish').length +
              (myFoodOnly ? 1 : 0)
            }
          />
        </div>
      </div>
    </>
  );
};

export default observer(SearchFood);

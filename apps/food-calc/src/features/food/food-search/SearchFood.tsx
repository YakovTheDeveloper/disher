import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { FoodActionCard } from './food-action-card';
import { FilterPanel } from './FilterPanel';
import { useCategoryFilterState } from '@/features/shared/hooks/useCategoryFilterState';
import { SearchFoodControls } from '@/features/food/food-search/SearchFoodControls';
import { FilterButton } from '@/shared/ui/atoms/Button';
import toaster from '@/shared/lib/toaster/toaster';
import { getProductUrl, RouterUrls } from '@/app/router';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import {
  useProducts,
  createProduct,
  getProductCategoryGroups,
  getProductCategoryOptions,
} from '@/entities/product';
import {
  useDishes,
  createDish,
  getDishCategoryGroups,
  getDishCategoryOptions,
} from '@/entities/dish';
import { VirtualList } from '@/shared/ui/VirtualList';
import { computeDishDietaryCategories } from '@/shared/lib/dishCategories';

export type SearchMode = 'products-only' | 'dishes-only' | 'products-and-dishes';

type SelectFoodPayload = { variant: 'product' | 'dish'; id: string; name: string };

type Props = {
  onSelectFood: (payload: SelectFoodPayload) => void;
  mode: SearchMode;
  activeItemId?: string | null;
  richNutrient?: { id: string; unit: string } | null;
  renderSearchItemRight?: (variant: 'product' | 'dish', item: { id: string; name: string; userId?: string }) => React.ReactNode;
  onBack?: () => void;
  searchBarLeftChild?: React.ReactNode;
  searchBarRightChild?: React.ReactNode;
  itemHtmlFor?: string;
  inputId?: string;
};

type EmptyStateProps = {
  query: string;
  label: string;
  onCreate: () => void;
};

const EmptyState = ({ query, label, onCreate }: EmptyStateProps) => (
  <div className={styles.emptyState}>
    <p className={styles.emptyStateMessage}>
      По запросу <em>«{query}»</em> ничего нет
    </p>
    <button className={styles.emptyStateAction} onClick={onCreate}>
      <span className={styles.emptyStateIcon}>+</span>
      Создать {label} «{query}»
    </button>
  </div>
);

const getDefaultTab = (mode: SearchMode) => (mode === 'dishes-only' ? 'блюда' : 'продукты');

const SearchFood = ({
  onSelectFood,
  mode = 'products-and-dishes',
  activeItemId,
  richNutrient,
  renderSearchItemRight,
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

  const { results: productsMap, fetching: productsFetching } = useProducts(
    searchQuery || undefined
  );
  const { results: dishesMap, fetching: dishesFetching } = useDishes(searchQuery || undefined);

  const allProducts = useMemo(
    () => (productsMap ? Array.from(productsMap.values()) : []),
    [productsMap]
  );
  const allDishes = useMemo(() => (dishesMap ? Array.from(dishesMap.values()) : []), [dishesMap]);

  // Normalized products map keyed by id — used for dish dietary category computation
  const productsById = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts]
  );

  const categoryFilter = useCategoryFilterState();
  const currentFilterType = currentTab === 'продукты' ? 'product' : 'dish';

  // Product filtering — OR logic: show if product has ANY selected category
  const selectedProductCategories = categoryFilter.getCategoryFilter('product');
  const products = useMemo(() => {
    if (selectedProductCategories.length === 0) return allProducts;
    return allProducts.filter((p) => {
      if (!p.categories) return false;
      return selectedProductCategories.some((cat) => p.categories!.has(cat));
    });
  }, [allProducts, selectedProductCategories]);

  // Dish filtering — AND logic: show if dish satisfies ALL selected dietary categories
  const selectedDishCategories = categoryFilter.getCategoryFilter('dish');
  const dishes = useMemo(() => {
    if (selectedDishCategories.length === 0) return allDishes;
    return allDishes.filter((dish) => {
      const computed = computeDishDietaryCategories(dish, productsById);
      return selectedDishCategories.every((cat) => computed.has(cat as never));
    });
  }, [allDishes, selectedDishCategories, productsById]);

  const richNutrientInfo = useMemo(
    () => (richNutrient ? allNutrientsList.find((n) => n.id === richNutrient.id) : null),
    [richNutrient]
  );

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

  const handleCreateProduct = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    const productId = await createProduct({ name });
    setSearchQuery('');
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: getProductUrl(productId) },
    });
  }, [searchQuery]);

  const handleCreateDish = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    const dishId = await createDish(name);
    setSearchQuery('');
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
  }, [searchQuery]);

  const isSearchActive = searchQuery.trim().length >= 2;
  const isLoading = productsFetching || dishesFetching;
  const trimmedQuery = searchQuery.trim();

  const productEmptyContent =
    !isLoading && isSearchActive ? (
      <EmptyState query={trimmedQuery} label="продукт" onCreate={handleCreateProduct} />
    ) : undefined;

  const dishEmptyContent =
    !isLoading && isSearchActive ? (
      <EmptyState query={trimmedQuery} label="блюдо" onCreate={handleCreateDish} />
    ) : undefined;

  const renderProductItem = useCallback(
    (item: (typeof products)[number]) => (
      <FoodActionCard
        variant="product"
        item={item}
        active={activeItemId === item.id}
        onClick={() => onFoodAdd(item)}
        rightChild={renderSearchItemRight?.('product', item)}
        richNutrientId={richNutrient?.id}
        richNutrientUnit={richNutrient?.unit}
        richNutrientMax={0}
      />
    ),
    [activeItemId, onFoodAdd, renderSearchItemRight, richNutrient]
  );

  const renderDishItem = useCallback(
    (item: (typeof dishes)[number]) => (
      <FoodActionCard
        variant="dish"
        item={item}
        active={activeItemId === item.id}
        onClick={() => onDishAdd(item)}
        rightChild={renderSearchItemRight?.('dish', item)}
      />
    ),
    [activeItemId, onDishAdd, renderSearchItemRight]
  );

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <SearchFoodControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          mode={mode}
          onBack={onBack}
          searchBarLeftChild={searchBarLeftChild}
          searchBarRightChild={searchBarRightChild}
          inputId={inputId}
        />
        {mode === 'products-and-dishes' && (
          <div className={styles.tabBar}>
            <button
              className={clsx(styles.tabBarItem, currentTab === 'продукты' && styles.tabBarItem_active)}
              onClick={() => setCurrentTab('продукты')}
            >
              Продукты
            </button>
            <button
              className={clsx(styles.tabBarItem, currentTab === 'блюда' && styles.tabBarItem_active)}
              onClick={() => setCurrentTab('блюда')}
            >
              Блюда
            </button>
          </div>
        )}
      </div>

      {richNutrientInfo && (
        <div className={styles.filterMessage}>
          Богатые по <strong>{richNutrientInfo.displayNameRu}</strong>
        </div>
      )}

      {currentTab === 'продукты' && (
        <VirtualList
          items={products}
          renderItem={renderProductItem}
          emptyContent={productEmptyContent}
          itemHtmlFor={itemHtmlFor}
        />
      )}
      {(currentTab === 'блюда' || mode === 'dishes-only') && (
        <VirtualList
          items={dishes}
          renderItem={renderDishItem}
          emptyContent={dishEmptyContent}
          itemHtmlFor={itemHtmlFor}
        />
      )}

      <section
        className={clsx(styles.filterWrapper, !filterPanelOpen && styles.filterWrapper_hidden)}
      >
        <FilterPanel
          isOpen={filterPanelOpen}
          header={
            currentTab === 'продукты' ? (
              <div className={styles.filterChips}>
                <button
                  className={clsx(styles.filterChip, myFoodOnly && styles.filterChipActive)}
                  onClick={() => setMyFoodOnly((prev) => !prev)}
                >
                  Моя еда
                </button>
              </div>
            ) : null
          }
          groups={currentTab === 'продукты' ? getProductCategoryGroups() : getDishCategoryGroups()}
          options={currentTab === 'продукты' ? getProductCategoryOptions() : getDishCategoryOptions()}
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
        />
      </div>
    </div>
  );
};

export default SearchFood;

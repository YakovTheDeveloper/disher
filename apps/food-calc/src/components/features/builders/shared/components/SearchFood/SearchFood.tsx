import { List } from '@/components/features/builders/shared/ContentEdit/Food/List';
import { SearchState } from '@/components/features/builders/shared/ContentEdit/Food/List/List.types';
import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { FoodActionCard } from '@/components/features/food/food-action-card';
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
import toaster from '@/infrastructure/toaster/toaster';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useProducts, createProduct } from '@/entities/product';
import { useDishes, createDish } from '@/entities/dish';

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
  itemHtmlFor?: string;
  inputId?: string;
};

const getDefaultTab = (mode: SearchMode) => (mode === 'dishes-only' ? 'блюда' : 'продукты');

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

  const products = useMemo(
    () => (productsMap ? Array.from(productsMap.values()) : []),
    [productsMap]
  );
  const dishes = useMemo(() => (dishesMap ? Array.from(dishesMap.values()) : []), [dishesMap]);

  const categoryFilter = useCategoryFilterState();
  const currentFilterType = currentTab === 'продукты' ? 'product' : 'dish';

  const searchState: SearchState<(typeof products)[number] | (typeof dishes)[number]> = {
    searchQuery,
    setSearch: setSearchQuery,
    currentTab,
    setTab: setCurrentTab,
    filteredList: currentTab === 'продукты' ? products : dishes,
    clearSearch: () => setSearchQuery(''),
  };

  const richNutrient = useMemo(
    () => (sortByNutrientId ? allNutrientsList.find((n) => n.id === sortByNutrientId) : null),
    [sortByNutrientId]
  );

  const onFoodAdd = useCallback(
    (item: { id: string }) => onFinish({ variant: 'product', id: item.id }),
    [onFinish]
  );
  const onDishAdd = useCallback(
    (item: { id: string }) => onFinish({ variant: 'dish', id: item.id }),
    [onFinish]
  );

  const handleCreateProduct = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    await createProduct({ name });
    setSearchQuery('');
    toaster.success(`Продукт "${name}" создан`);
  }, [searchQuery]);

  const handleCreateDish = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    await createDish(name);
    setSearchQuery('');
    toaster.success(`Блюдо "${name}" создано`);
  }, [searchQuery]);

  const isSearchActive = searchQuery.trim().length >= 2;
  const isLoading = productsFetching || dishesFetching;

  const productEmptyContent =
    !isLoading && isSearchActive ? (
      <button className={styles.createSuggestion} onClick={handleCreateProduct}>
        {'Ничего не нашлось — создать продукт "' + searchQuery.trim() + '"'}
      </button>
    ) : undefined;

  const dishEmptyContent =
    !isLoading && isSearchActive ? (
      <button className={styles.createSuggestion} onClick={handleCreateDish}>
        {'Ничего не нашлось — создать блюдо "' + searchQuery.trim() + '"'}
      </button>
    ) : undefined;

  const renderProductItem = useCallback(
    (item: (typeof products)[number]) => (
      <FoodActionCard
        variant="product"
        item={item}
        active={currentProductId === item.id}
        onClick={() => onFoodAdd(item)}
        onAdd={() => onFoodAdd(item)}
        showInfo={showInfoButtonOnListItem}
        showMore={showMore}
        richNutrientId={sortByNutrientId}
        richNutrientUnit={sortByNutrientUnit}
        richNutrientMax={0}
      />
    ),
    [
      currentProductId,
      onFoodAdd,
      showInfoButtonOnListItem,
      showMore,
      sortByNutrientId,
      sortByNutrientUnit,
    ]
  );

  const renderDishItem = useCallback(
    (item: (typeof dishes)[number]) => (
      <FoodActionCard
        variant="dish"
        item={item}
        active={currentDishId === item.id}
        onClick={() => onDishAdd(item)}
        onAdd={() => onDishAdd(item)}
        showInfo={showInfoButtonOnListItem}
        showMore={showMore}
      />
    ),
    [currentDishId, onDishAdd, showInfoButtonOnListItem, showMore]
  );

  const productSearchState = { ...searchState, filteredList: products };
  const dishSearchState = { ...searchState, filteredList: dishes };

  return (
    <>
      <div className={styles.content}>
        <div className={styles.header}>
          <SearchFoodControls
            searchState={searchState}
            onFocusChange={onFocusChange}
            toggleFilterPanel={() => setFilterPanelOpen((p) => !p)}
            mode={mode}
            actionLeft={actionLeft}
            actionRight={actionRight}
            inputId={inputId}
          />
        </div>

        {richNutrient && (
          <div className={styles.filterMessage}>
            Богатые по <strong>{richNutrient.displayNameRu}</strong>
          </div>
        )}

        {currentTab === 'продукты' && (
          <List
            isShow={true}
            after={null}
            queryKey="productSearch"
            onFetch={async () => ({ items: [], hasMore: false })}
            search={productSearchState}
            renderListContent={renderProductItem}
            emptyContent={productEmptyContent}
            onClose={() => {}}
            itemHtmlFor={itemHtmlFor}
          />
        )}
        {(currentTab === 'блюда' || mode === 'dishes-only') && (
          <List
            isShow={true}
            after={null}
            queryKey="dishSearch"
            onFetch={async () => ({ items: [], hasMore: false })}
            search={dishSearchState}
            renderListContent={renderDishItem}
            emptyContent={dishEmptyContent}
            onClose={() => {}}
            itemHtmlFor={itemHtmlFor}
          />
        )}

        <section
          className={clsx(styles.filterWrapper, !filterPanelOpen && styles.filterWrapper_hidden)}
        >
          <FilterPanel
            isOpen={filterPanelOpen}
            header={
              <div>
                {mode === 'products-and-dishes' && (
                  <div className={styles.filterTabs}>
                    <button
                      className={`${styles.filterTab} ${currentTab === 'продукты' ? styles.filterTabActive : ''}`}
                      onClick={() => setCurrentTab('продукты')}
                    >
                      Продукты
                    </button>
                    <button
                      className={`${styles.filterTab} ${currentTab === 'блюда' ? styles.filterTabActive : ''}`}
                      onClick={() => setCurrentTab('блюда')}
                    >
                      Блюда
                    </button>
                  </div>
                )}
                {currentTab === 'продукты' && (
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
              currentTab === 'продукты' ? getProductCategoryGroups() : getDishCategoryGroups()
            }
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
          />
        </div>
      </div>
    </>
  );
};

export default SearchFood;

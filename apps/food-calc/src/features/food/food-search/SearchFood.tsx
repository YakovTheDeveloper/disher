import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFood.module.scss';
import { FoodActionCard } from './food-action-card';
import { useCategoryFilterState } from '@/features/shared/hooks/useCategoryFilterState';
import { SearchFoodControls } from '@/features/food/food-search/SearchFoodControls';
import { FilterButton } from '@/shared/ui/atoms/Button';
import { FilterPanel } from '@/shared/ui/FilterPanel';
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

export type SearchMode = 'products-only' | 'dishes-only' | 'products-and-dishes';

type Props = {
  onFinish: (payload: { variant: 'product' | 'dish'; id: string }) => void;
  mode: SearchMode;
  activeItemId?: string | null;
  richNutrient?: { id: string; unit: string } | null;
  listItemsHasAdditionalActions?: boolean;
  onBack?: () => void;
  searchBarLeftChild?: React.ReactNode;
  searchBarRightChild?: React.ReactNode;
  itemHtmlFor?: string;
  inputId?: string;
};

const getDefaultTab = (mode: SearchMode) => (mode === 'dishes-only' ? 'блюда' : 'продукты');

const SearchFood = ({
  onFinish,
  mode = 'products-and-dishes',
  activeItemId,
  richNutrient,
  listItemsHasAdditionalActions = false,
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

  const products = useMemo(
    () => (productsMap ? Array.from(productsMap.values()) : []),
    [productsMap]
  );
  const dishes = useMemo(() => (dishesMap ? Array.from(dishesMap.values()) : []), [dishesMap]);

  const categoryFilter = useCategoryFilterState();
  const currentFilterType = currentTab === 'продукты' ? 'product' : 'dish';

  const richNutrientInfo = useMemo(
    () => (richNutrient ? allNutrientsList.find((n) => n.id === richNutrient.id) : null),
    [richNutrient]
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
        active={activeItemId === item.id}
        onClick={() => onFoodAdd(item)}
        showMore={listItemsHasAdditionalActions}
        richNutrientId={richNutrient?.id}
        richNutrientUnit={richNutrient?.unit}
        richNutrientMax={0}
      />
    ),
    [activeItemId, onFoodAdd, listItemsHasAdditionalActions, richNutrient]
  );

  const renderDishItem = useCallback(
    (item: (typeof dishes)[number]) => (
      <FoodActionCard
        variant="dish"
        item={item}
        active={activeItemId === item.id}
        onClick={() => onDishAdd(item)}
        showMore={listItemsHasAdditionalActions}
      />
    ),
    [activeItemId, onDishAdd, listItemsHasAdditionalActions]
  );

  return (
    <>
      <div className={styles.content}>
        <div className={styles.header}>
          <SearchFoodControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            currentTab={currentTab}
            toggleFilterPanel={() => setFilterPanelOpen((p) => !p)}
            mode={mode}
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

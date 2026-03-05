import { List } from '@/components/features/builders/shared/ContentEdit/Food/List';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { observer } from 'mobx-react-lite';
import { useCallback, useState, useMemo } from 'react';
import styles from './SearchFood.module.scss';
import { domainStore } from '@/store/store';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import { FoodNutrients } from '@/components/features/builders/shared/components/FoodNutrients';
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

export type SearchMode = 'products-only' | 'products-and-dishes';

type Props = {
  currentProductId?: string | null;
  currentDishId?: string | null;
  onFinish: (payload: { variant: 'product' | 'dish'; id: string }) => void;
  onFocusChange?: (focused: boolean) => void;
  onOpen?: () => void;
  mode: SearchMode;
};

const SearchFood = ({
  onFinish,
  currentProductId,
  currentDishId,
  onFocusChange,
  mode = 'products-and-dishes',
}: Props) => {
  const [currentInfoFood, setCurrentInfoFood] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Category filter state
  const categoryFilter = useCategoryFilterState();

  // Determine current filter type based on tab
  const getCurrentFilterType = (tab: string) => (tab === 'продукты' ? 'product' : 'dish');

  // Логика фильтрации - создаётся внутри компонента
  const filterKeys = ['name'] as const;

  const filterState = useFilteringStateV2(
    useMemo(
      () =>
        [
          {
            tabName: 'продукты',
            list: domainStore.foodStore.merged,
            filterKeys,
          },
          {
            tabName: 'блюда',
            list: domainStore.dishStore.merged,
            filterKeys,
          },
        ] as const,
      []
    )
  );

  const currentFilterType = getCurrentFilterType(filterState.currentTab);
  const currentCategoryFilter = categoryFilter.getCategoryFilter(currentFilterType);

  // Apply category filter to filtered list
  const filterStateWithCategory = useFilteringStateV2(
    useMemo(
      () =>
        [
          {
            tabName: 'продукты',
            list: domainStore.foodStore.merged,
            filterKeys,
          },
          {
            tabName: 'блюда',
            list: domainStore.dishStore.merged,
            filterKeys,
          },
        ] as const,
      []
    ),
    {
      categoryFilter: currentCategoryFilter,
    }
  );

  const onBackButton = () => setCurrentInfoFood('');

  const toggleFilterPanel = () => {
    setFilterPanelOpen((prev) => !prev);
  };

  const onFoodAdd = useCallback(
    (payload: any) => {
      console.log('payload', payload);
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

  const onProductClickSeeDetails = useCallback(() => {}, []);

  const renderProductItem = useCallback(
    (item: any) => {
      // Mobile click handler to work around keyboard dismissal issue

      return (
        <SearchListItem
          className=""
          onInfoClick={() => setCurrentInfoFood(item.id)}
          active={currentProductId === item.id.toString()}
          onClick={() => onFoodAdd(item)}
          item={item}
        />
      );
    },
    [currentProductId, onFoodAdd]
  );

  const renderDishtItem = useCallback(
    (item: any) => {
      const isActive = currentDishId === item.id.toString();

      // Mobile click handler to work around keyboard dismissal issue

      return (
        <SearchListItem
          className=""
          item={item}
          active={isActive}
          onInfoClick={() => setCurrentInfoFood(item.id)}
        >
          <FoodName content={item} className="ellipsis" onClick={() => onDishAdd(item)} />
        </SearchListItem>
      );
    },
    [currentDishId, onDishAdd, onProductClickSeeDetails]
  );

  return (
    <>
      <div className={styles.content}>
        {currentInfoFood && (
          <div className={styles.foodInfo}>
            <FoodNutrients
              foodId={currentInfoFood}
              className={styles.foodInfoNutrients}
              before={<button onClick={onBackButton}>{'<-'}</button>}
            />
          </div>
        )}

        <div className={styles.header}>
          <SearchFoodControls
            searchState={filterStateWithCategory}
            onFocusChange={onFocusChange}
            toggleFilterPanel={toggleFilterPanel}
          />
        </div>

        {filterStateWithCategory.currentTab === 'продукты' && (
          <List
            isShow={true}
            after={null}
            queryKey="productSearch"
            onFetch={async () => ({ items: [], hasMore: false })}
            search={filterStateWithCategory}
            renderListContent={renderProductItem}
            onClose={() => {}}
          />
        )}
        {filterStateWithCategory.currentTab === 'блюда' && mode === 'products-and-dishes' && (
          <List
            isShow={true}
            after={null}
            queryKey="dishSearch"
            onFetch={async () => ({ items: [], hasMore: false })}
            search={filterStateWithCategory}
            renderListContent={renderDishtItem}
            onClose={() => {}}
          />
        )}

        {/* Filter Panel at bottom of screen */}
        <section className={styles.filterWrapper}>
          {/* Tabs for switching between Products and Dishes */}
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

          <FilterPanel
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
          <FilterButton isActive={filterPanelOpen} onClick={toggleFilterPanel} />
        </div>
      </div>
    </>
  );
};

export default observer(SearchFood);

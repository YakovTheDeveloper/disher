import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { productFactory } from '@/domain/product/Food.factory';
import { useListStateActions } from '@/components/features/lists/shared/hooks/useListStateActions';
import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import FilterListLayout from '@/components/features/lists/shared/FilterListLayout/FilterListLayout';
import { FilterPanel } from '@/components/features/lists/shared/FilterPanel';
import { ScrollTopButton } from '@/components/features/lists/shared/ScrollTopButton';
import commonStyles from '@/components/features/lists/shared/commonStyles.module.scss';
import clsx from 'clsx';
import styles from './ListProducts.module.scss';

type Props = {
  foodStore?: FoodStoreInstance;
};

const ListProducts = ({ foodStore = domainStore.foodStore }: Props) => {
  const { onAdd, navigate, filter } = useListStateActions({
    store: foodStore,
    navigateTo: RouterLinks.UserProduct,
    createEntity: () =>
      productFactory.createNewLocal({
        name: 'Новый продукт',
        description: '',
        createdByUser: true,
      }),
    filterKeys: ['name', 'description'],
  });

  const filterColumns = [
    {
      items: [
        { value: 'user', label: 'Мои продукты' },
        { value: 'system', label: 'Системные' },
      ],
    },
  ];

  const handleFilterChange = () => {
    // TODO: implement filter logic
  };

  return (
    <FilterListLayout
      filterPanel={
        <FilterPanel
          selectedFilters={['user']}
          columns={filterColumns}
          onFilterChange={handleFilterChange}
        />
      }
      searchPanel={
        <SearchInput
          wrapperClassName={commonStyles.searchWrapper}
          value={filter.filterText}
          size="medium"
          onChange={(e) => filter.setSearch(e.target.value)}
        />
      }
      searchPanelTitle="Продукты"
      mainContent={
        <ItemsList>
          {filter.filteredList.map((item) => (
            <li className={styles.listItem} key={item.id}>
              <p onClick={() => navigate(`${RouterLinks.UserProduct}/${item.id}`)}>
                {item.name || 'без имени'}
              </p>
            </li>
          ))}
        </ItemsList>
      }
      bottomActionsPanel={
        <>
          <ScrollTopButton
            className={clsx([commonStyles.actionButton, commonStyles.scrollToTopButton])}
          />
          <button
            onClick={onAdd}
            className={clsx([commonStyles.actionButton, commonStyles.addButton])}
          />
        </>
      }
    />
  );
};

export default observer(ListProducts);

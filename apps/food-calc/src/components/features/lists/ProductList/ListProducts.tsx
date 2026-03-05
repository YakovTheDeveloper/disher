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
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import { SimpleListItem } from '@/components/ui/list-item/SimpleListItem';
import { PopoverTrigger } from '@/components/ui/popover/PopoverTrigger';
import AddListItemButton from '@/components/ui/atoms/Button/AddListItemButton/AddListItemButton';
import Button from '@/components/ui/atoms/Button/Button';
import { drawerStoreV3 } from '@/store/GlobalUiStore/DrawerStoreV3/DrawerStoreV3';
import { AddProductToDayScheduleOverlay } from '@/components/features/daySchedule/add-product-to-day-schedule/AddProductToDayScheduleOverlay';
import { AddProductToDishOverlay } from '@/components/features/dish/add-product-to-dish/AddProductToDishOverlay';

import commonStyles from '@/components/features/lists/shared/commonStyles.module.scss';
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
    <Screen offsetTop bottomRight={<AddButton onClick={onAdd} />} actions={<></>}>
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
              <SimpleListItem
                key={item.id}
                rightSlot={
                  <PopoverTrigger
                    trigger={<AddListItemButton />}
                    content={
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            drawerStoreV3.show(AddProductToDayScheduleOverlay, {
                              productId: item.id,
                            })
                          }
                        >
                          Добавить в день
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            drawerStoreV3.show(AddProductToDishOverlay, { productId: item.id })
                          }
                        >
                          Добавить в блюдо
                        </Button>
                      </>
                    }
                  />
                }
              >
                <p onClick={() => navigate(`${RouterLinks.UserProduct}/${item.id}`)}>
                  {item.name || 'без имени'}
                </p>
              </SimpleListItem>
            ))}
          </ItemsList>
        }
      />
    </Screen>
  );
};

export default observer(ListProducts);

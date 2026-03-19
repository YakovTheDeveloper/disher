import { useState, useMemo } from 'react';
import { useProducts, createProduct } from '@/entities/product';
import { RouterLinks } from '@/router';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import FilterListLayout from '@/components/features/lists/shared/FilterListLayout/FilterListLayout';
import { FilterPanel } from '@/components/features/lists/shared/FilterPanel';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import { SimpleListItem } from '@/components/ui/list-item/SimpleListItem';
import { PopoverTrigger } from '@/components/ui/popover/PopoverTrigger';
import AddListItemButton from '@/components/ui/atoms/Button/AddListItemButton/AddListItemButton';
import Button from '@/components/ui/atoms/Button/Button';
import { drawerStore } from '@/shared/ui/drawer-store';
import { AddProductToDayScheduleOverlay } from '@/components/features/daySchedule/add-product-to-day-schedule/AddProductToDayScheduleOverlay';
import { AddProductToDishOverlay } from '@/components/features/dish/add-product-to-dish/AddProductToDishOverlay';
import { useNavigate } from 'react-router';

import commonStyles from '@/components/features/lists/shared/commonStyles.module.scss';
import './ListProducts.module.scss';

const ListProducts = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const { results: products } = useProducts(searchText || undefined);

  const productList = useMemo(() => {
    return products ? Array.from(products.values()) : [];
  }, [products]);

  const onAdd = async () => {
    const id = await createProduct({
      name: 'Новый продукт',
      description: '',
    });
    navigate(`${RouterLinks.Product}/${id}`);
  };

  const filterColumns = [
    {
      items: [
        { value: 'user', label: 'Мои продукты' },
        { value: 'system', label: 'Системные' },
      ],
    },
  ];

  const handleFilterChange = () => {
    // filter logic placeholder
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
            value={searchText}
            size="medium"
            onChange={(e) => setSearchText(e.target.value)}
          />
        }
        searchPanelTitle="Продукты"
        mainContent={
          <ItemsList>
            {productList.map((item) => (
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
                            drawerStore.show(AddProductToDayScheduleOverlay, {
                              productId: item.id,
                            })
                          }
                        >
                          Добавить в день
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            drawerStore.show(AddProductToDishOverlay, { productId: item.id })
                          }
                        >
                          Добавить в блюдо
                        </Button>
                      </>
                    }
                  />
                }
              >
                <p onClick={() => navigate(`${RouterLinks.Product}/${item.id}`)}>
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

export default ListProducts;

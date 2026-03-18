import { useState, useMemo } from 'react';
import { useDishes, createDish } from '@/entities/dish';
import { RouterLinks } from '@/router';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import FilterListLayout from '@/components/features/lists/shared/FilterListLayout/FilterListLayout';
import styles from '../shared/commonStyles.module.scss';
import { FilterPanel } from '../shared/FilterPanel';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import { PopoverTrigger } from '@/components/ui/popover/PopoverTrigger';
import AddListItemButton from '@/components/ui/atoms/Button/AddListItemButton/AddListItemButton';
import { drawerStore } from '@/shared/ui/drawer-store';
import { AddDishToDayScheduleOverlay } from '@/components/features/daySchedule/add-dish-to-day-schedule/AddDishToDayScheduleOverlay';
import { useNavigate } from 'react-router';

const ListDishes = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const { results: dishes } = useDishes(searchText || undefined);

  const dishList = useMemo(() => {
    return dishes ? Array.from(dishes.values()) : [];
  }, [dishes]);

  const onAdd = async () => {
    const id = await createDish('Новое блюдо');
    navigate(`${RouterLinks.DishBuilder}/${id}`);
  };

  const filterColumns = [
    {
      items: [
        { value: 'breakfast', label: 'Завтрак' },
        { value: 'lunch', label: 'Обед' },
        { value: 'dinner', label: 'Ужин' },
      ],
    },
    {
      items: [
        { value: 'vegan', label: 'Веган' },
        { value: 'vegetarian', label: 'Вегетарианец' },
        { value: 'meat', label: 'Мясоед' },
      ],
    },
  ];

  return (
    <Screen offsetTop bottomRight={<AddButton onClick={onAdd} />} actions={<></>}>
      <FilterListLayout
        filterPanel={<FilterPanel selectedFilters={['breakfast']} columns={filterColumns} />}
        searchPanel={
          <SearchInput
            wrapperClassName={styles.searchWrapper}
            value={searchText}
            size="medium"
            onChange={(e) => setSearchText(e.target.value)}
          />
        }
        searchPanelTitle="Блюда"
        mainContent={
          <ItemsList>
            {dishList.map((item) => (
              <div key={item.id} className={styles.listItemWrapper}>
                <li className={styles.listItem}>
                  <p onClick={() => navigate(`${RouterLinks.DishBuilder}/${item.id}`)}>
                    {item.name || 'без имени'}
                  </p>
                </li>
                <PopoverTrigger
                  trigger={<AddListItemButton />}
                  content={
                    <button
                      type="button"
                      onClick={() =>
                        drawerStore.show(AddDishToDayScheduleOverlay, { dishId: item.id })
                      }
                    >
                      Добавить в день
                    </button>
                  }
                />
              </div>
            ))}
          </ItemsList>
        }
      />
    </Screen>
  );
};

export default ListDishes;

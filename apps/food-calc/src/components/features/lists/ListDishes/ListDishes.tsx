import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { DishStoreInstance } from '@/store/DishStore/DishStore';
import { DishFactory } from '@/store/DishStore/Dish.factory';
import { useListStateActions } from '@/components/features/lists/shared/hooks/useListStateActions';
import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import FilterListLayout from '@/components/features/lists/shared/FilterListLayout/FilterListLayout';
import styles from '../shared/commonStyles.module.scss';

import { FilterPanel } from '../shared/FilterPanel';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import { PopoverTrigger } from '@/components/ui/popover/PopoverTrigger';
import AddListItemButton from '@/components/ui/atoms/Button/AddListItemButton/AddListItemButton';
import { drawerStoreV3 } from '@/store/GlobalUiStore/DrawerStoreV3/DrawerStoreV3';
import { AddDishToDayScheduleOverlay } from '@/components/features/daySchedule/add-dish-to-day-schedule/AddDishToDayScheduleOverlay';
type Props = {
  dishStore?: DishStoreInstance;
};

const ListDishes = ({ dishStore = domainStore.dishStore }: Props) => {
  const { onAdd, navigate, filter } = useListStateActions({
    store: dishStore,
    navigateTo: RouterLinks.DishBuilder,
    createEntity: () =>
      DishFactory.createNewLocal({
        name: 'Новое блюдо',
        description: '',
        userId: 0,
      }),
    filterKeys: ['name', 'description'],
  });

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
            value={filter.filterText}
            size="medium"
            onChange={(e) => filter.setSearch(e.target.value)}
          />
        }
        searchPanelTitle="Блюда"
        mainContent={
          <ItemsList>
            {filter.filteredList.map((item) => (
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
                        drawerStoreV3.show(AddDishToDayScheduleOverlay, { dishId: item.id })
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

export default observer(ListDishes);

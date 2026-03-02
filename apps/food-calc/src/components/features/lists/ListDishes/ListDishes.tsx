import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Button } from '@/components/ui/atoms/Button';
import { DishStoreInstance } from '@/store/DishStore/DishStore';
import { DishFactory } from '@/store/DishStore/Dish.factory';
import { useListStateActions } from '@/components/features/lists/shared/hooks/useListStateActions';
import { useScrollToTop } from '@/components/features/lists/shared/hooks/useScrollToTop';
import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import Logo from '@/assets/icons/logo.svg';
import FilterListLayout from '@/components/features/lists/shared/FilterListLayout/FilterListLayout';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import styles from '../shared/commonStyles.module.scss';
import { ScrollTopButton } from '../shared/ScrollTopButton';

import { FilterPanel } from '../shared/FilterPanel';
import clsx from 'clsx';
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
            <li className={styles.listItem} key={item.id}>
              <p onClick={() => navigate(`${RouterLinks.DishBuilder}/${item.id}`)}>
                {item.name || 'без имени'}
              </p>
            </li>
          ))}
        </ItemsList>
      }
      bottomActionsPanel={
        <>
          <ScrollTopButton className={clsx([styles.actionButton, styles.scrollToTopButton])} />
          <button onClick={onAdd} className={clsx([styles.actionButton, styles.addButton])} />
        </>
      }
    />
  );
};

export default observer(ListDishes);

import { observer } from 'mobx-react-lite';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { DailyNormStoreInstance } from '@/store/DailyNormStore/DailyNormStore';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import styles from './ListDailyNorms.module.scss';
import { useListStateActions } from '@/components/features/lists/shared/hooks/useListStateActions';
import { DailyNormsFactory } from '@/domain/dailyNorm/factory';
import { SelectableItem } from '@/components/ui/SelectableItem';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import FilterListLayout from '@/components/features/lists/shared/FilterListLayout/FilterListLayout';
import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import { FilterPanel } from '@/components/features/lists/shared/FilterPanel';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';

import commonStyles from '../shared/commonStyles.module.scss';

type Props = {
  children?: React.ReactNode;
  store?: DailyNormStoreInstance;
  selectableItems?: boolean;
  addControls?: boolean;
};

const ListDailyNorms = ({ store = domainStore.dailyNormStore }: Props) => {
  // const navigate = useNavigate();

  const { onAdd, navigate, filter } = useListStateActions({
    store,
    navigateTo: RouterLinks.DailyNorms,
    createEntity: () =>
      DailyNormsFactory.createNewLocal({
        name: 'Новая норма',
        description: '',
        createByUser: true,
      }),
    filterKeys: ['name', 'description'],
  });

  return (
    <Screen offsetTop bottomRight={<AddButton onClick={onAdd} />} actions={<></>}>
      <FilterListLayout
        searchPanelTitle="Нормы"
        searchPanel={
          <SearchInput
            wrapperClassName={commonStyles.searchWrapper}
            value={filter.filterText}
            onChange={(e) => filter.setSearch(e.target.value)}
          />
        }
        filterPanel={<FilterPanel selectedFilters={[]} columns={[]} onFilterChange={() => {}} />}
        mainContent={
          <ItemsList>
            {filter.filteredList.map((item) => (
              <SelectableItem
                key={item.id}
                id={item.id}
                isSelected={store.selectedNormId === item.id}
                onSelect={(id) => store.setSelectedId(id)}
              >
                <CommonListItem
                  id={item.id}
                  variant={2}
                  className={styles.listItem}
                  isSelectMode={true}
                  isSelected={store.selectedNormId === item.id}
                  onSelect={(id) => store.setSelectedId(id)}
                >
                  <p onClick={() => navigate(`${RouterLinks.DailyNorms}/${item.id}`)}>
                    {item.name || 'без имени'}
                  </p>
                </CommonListItem>
              </SelectableItem>
            ))}
          </ItemsList>
        }
      />
    </Screen>
  );
};

export default observer(ListDailyNorms);

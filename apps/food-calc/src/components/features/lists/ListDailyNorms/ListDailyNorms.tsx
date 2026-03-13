import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { DailyNormStoreInstance } from '@/store/DailyNormStore/DailyNormStore';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import styles from './ListDailyNorms.module.scss';
import { useListStateActions } from '@/components/features/lists/shared/hooks/useListStateActions';
import { DailyNormsFactory } from '@/domain/dailyNorm/factory';
import FilterListLayout from '@/components/features/lists/shared/FilterListLayout/FilterListLayout';
import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import { FilterPanel } from '@/components/features/lists/shared/FilterPanel';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import { ListItem } from '@/components/ui/list-item/ListItem';
import TickIcon from '@icons/tick.svg';

import commonStyles from '../shared/commonStyles.module.scss';

type Props = {
  children?: React.ReactNode;
  store?: DailyNormStoreInstance;
  selectableItems?: boolean;
  addControls?: boolean;
};

const SelectButton = ({ isSelected, onSelect }: { isSelected: boolean; onSelect: () => void }) => (
  <button
    type="button"
    className={clsx(styles.selectBtn, isSelected && styles.selectBtn_active)}
    onClick={(e) => {
      e.stopPropagation();
      onSelect();
    }}
  >
    <AnimatePresence mode="wait">
      {isSelected && (
        <motion.span
          key="tick"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={styles.tickWrap}
        >
          <TickIcon />
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);

const ListDailyNorms = ({ store = domainStore.dailyNormStore }: Props) => {
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
          <ul className={styles.list}>
            <AnimatePresence initial={false}>
              {filter.filteredList.map((item, i) => {
                const isSelected = store.selectedNormId === item.id;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28, delay: i * 0.03 }}
                  >
                    <ListItem
                      active={isSelected}
                      onClick={() => navigate(`${RouterLinks.DailyNorms}/${item.id}`)}
                      before={
                        <SelectButton
                          isSelected={isSelected}
                          onSelect={() => store.setSelectedId(item.id)}
                        />
                      }
                    >
                      {item.name || 'без имени'}
                    </ListItem>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ul>
        }
      />
    </Screen>
  );
};

export default observer(ListDailyNorms);

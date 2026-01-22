import { observer, useLocalObservable } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useInteractions,
  useClick,
} from '@floating-ui/react';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import SearchInput from '@/components/ui/Input/SearchInput/SearchInput';
import { foodSearchConfing } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/config/config';
import { FilteringState } from '@/components/features/shared/hooks/useFilteringState';

type Tabs = 'продукты' | 'блюда';

type Props = {
  searchState: FilteringState<
    (typeof foodSearchConfing)[number]['tabName'],
    typeof foodSearchConfing
  >;
  isVisible: boolean;
  className: string;
  modalStore?: ModalStoreInstance;
};

const SearchFoodControls = ({
  searchState,
  isVisible,
  className,
  modalStore = domainStore.globalUiStore.modalStore,
}: Props) => {
  const navigate = useNavigate();
  const [filterPanel, setFilterPanel] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const getTabLabel = (tab: Tabs) => {
    switch (tab) {
      case 'продукты':
        return 'Продукты';
      case 'блюда':
        return 'Блюда';
      default:
        return '';
    }
  };

  // const getFilterLabel = (tab: string) => {
  //   switch (tab) {
  //     case 'all':
  //       return 'Все категории';
  //     case 'vegan':
  //       return 'Веганские';
  //     case 'vegeterian':
  //       return 'Вегетерианские';
  //     default:
  //       return 'Все категории';
  //   }
  // };

  const openFilterPanel = () => {
    setFilterPanel((prev) => !prev);
  };

  const otherTabButton = () => {
    if (searchState.currentTab === 'продукты')
      return (
        <span
          className={`${styles.tabButton} ${styles.active}`}
          onClick={() => {
            searchState.setTab('блюда');
            setFilterPanel(false);
          }}
        >
          Блюда
        </span>
      );
    return (
      <span
        className={`${styles.tabButton} ${styles.active}`}
        onClick={() => {
          searchState.setTab('продукты');
          setFilterPanel(false);
        }}
      >
        Продукты
      </span>
    );
  };

  const onAddButtonClick = () => {
    modalStore.openModal(ModalType.CREATE_FOOD);
    // modalStore.openModal(ModalType.CREATE_DISH)
  };

  const onSubFilterChoose = (value: string) => {};

  const subFilterTabs = [
    { value: 'vegetarian', label: 'Вегетерианские' },
    { value: 'diary', label: 'Молочные' },
    { value: 'sea', label: 'Морепродукты' },
  ];
  if (!isVisible) return null;

  return (
    <header className={clsx([styles.header, className])}>
      <div className={clsx(styles.selectPanel, filterPanel && styles.selectPanelOpen)}>
        <div className={styles.subFilterTabs}>
          {subFilterTabs.map(({ value, label }) => (
            <span
              key={value}
              className={`${styles.tabButton} ${styles.active}`}
              onClick={() => onSubFilterChoose(value)}
            >
              {label}
            </span>
          ))}
        </div>
        <div className={styles.alternativeFilterButtonWrapper}>{otherTabButton()}</div>
      </div>

      <button className={`${styles.createFoodButton} ${styles.active}`} onClick={onAddButtonClick}>
        +
      </button>
      <SearchInput
        id="search-input"
        ref={searchInputRef}
        placeholder="Например, рис"
        value={searchState.filterText}
        onChange={(e) => searchState.setSearch(e.target.value)}
      />

      <span className={`${styles.tabButton} ${styles.active}`} onClick={openFilterPanel}>
        {getTabLabel(searchState.currentTab)}
      </span>
    </header>
  );
};

export default observer(SearchFoodControls);

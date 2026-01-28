import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import { useNavigate } from 'react-router';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import SearchInput from '@/components/ui/Input/SearchInput/SearchInput';
import { foodSearchConfing } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/config/config';
import { FilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { emitter } from '@/infrastructure/emitter/emitter';

type Tabs = 'продукты' | 'блюда';

type Props = {
  searchState: FilteringState<
    (typeof foodSearchConfing)[number]['tabName'],
    typeof foodSearchConfing
  >;
  isVisible: boolean;
  className: string;
  onFocusChange?: (focused: boolean) => void;
};

const SearchFoodControls = ({ searchState, isVisible, className, onFocusChange }: Props) => {
  const [filterPanel, setFilterPanel] = useState(false);
  const [selectedSubFilter, setSelectedSubFilter] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = () => searchInputRef.current?.focus();
    emitter.on('WIZARD_FOCUS', handler);
    return () => emitter.off('WIZARD_FOCUS', handler);
  }, []);

  const toggleFilterPanel = () => {
    setFilterPanel((prev) => !prev);
  };

  const handleTabSwitch = (newTab: Tabs) => {
    searchState.setTab(newTab);
    setFilterPanel(false);
  };

  const otherTabButton = () => {
    const alternateTab = searchState.currentTab === 'продукты' ? 'блюда' : 'продукты';
    return (
      <span
        className={`${styles.tabButton} ${styles.active}`}
        onClick={() => handleTabSwitch(alternateTab)}
      >
        {alternateTab}
      </span>
    );
  };

  const onSubFilterChoose = (value: string) => {
    setSelectedSubFilter((prevSelected) => (prevSelected === value ? null : value));
  };

  const subFilterTabs = [
    { value: 'vegetarian', label: 'Вегетерианские' },
    { value: 'diary', label: 'Молочные' },
    { value: 'sea', label: 'Морепродукты' },
  ];

  if (!isVisible) return null;

  return (
    <header className={clsx([styles.header, className])}>
      {filterPanel && (
        <div className={clsx(styles.selectPanel, styles.selectPanelOpen)}>
          <div className={styles.subFilterTabs}>
            {subFilterTabs.map(({ value, label }) => (
              <span
                key={value}
                className={`${styles.tabButton} ${styles.active} ${selectedSubFilter === value ? styles.selected : ''}`}
                onClick={() => onSubFilterChoose(value)}
              >
                {label}
              </span>
            ))}
          </div>
          <div className={styles.alternativeFilterButtonWrapper}>{otherTabButton()}</div>
        </div>
      )}

      <SearchInput
        size="medium"
        id="search-input"
        ref={searchInputRef}
        className={styles.largeSearchInput}
        placeholder="Поиск"
        value={searchState.filterText}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        onChange={(e) => {
          e.preventDefault();
          searchState.setSearch(e.target.value);
        }}
      />

      <span className={`${styles.tabButton} ${styles.active}`} onClick={toggleFilterPanel}>
        {searchState.currentTab}
      </span>
    </header>
  );
};

export default observer(SearchFoodControls);

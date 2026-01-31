import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import { foodSearchConfing } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/config/config';
import { FilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { emitter } from '@/infrastructure/emitter/emitter';
import FilterPanel from '@/components/ui/FilterPanel/FilterPanel';
import { Button } from '@/components/ui/atoms/Button';
import { UseFilteringStateV2Return } from '@/components/features/shared/hooks/useFilteringStateV2';

type Tabs = 'продукты' | 'блюда';

type Props = {
  searchState: UseFilteringStateV2Return;
  className: string;
  onFocusChange?: (focused: boolean) => void;
};

const SearchFoodControls = ({ searchState, className, onFocusChange }: Props) => {
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

  const onSubFilterChoose = (value: string) => {
    setSelectedSubFilter((prevSelected) => (prevSelected === value ? null : value));
  };

  const subFilterTabs = [
    { value: 'vegetarian', label: 'Вегетерианские' },
    { value: 'diary', label: 'Молочные' },
    { value: 'sea', label: 'Морепродукты' },
  ];

  // Prepare FilterPanel options
  const primaryOptions = useMemo(
    () => [
      { value: 'продукты', label: 'Продукты' },
      { value: 'блюда', label: 'Блюда' },
    ],
    []
  );

  const secondaryOptions = useMemo(
    () =>
      subFilterTabs.map(({ value, label }) => ({
        value,
        label,
      })),
    []
  );

  return (
    <header className={clsx([styles.header, className])}>
      <FilterPanel
        isOpen={filterPanel}
        primaryOptions={primaryOptions}
        selectedPrimary={searchState.currentTab}
        onPrimaryChange={(value) => handleTabSwitch(value as Tabs)}
        secondaryOptions={secondaryOptions}
        selectedSecondary={selectedSubFilter ? [selectedSubFilter] : []}
        onSecondaryChange={(value) => onSubFilterChoose(value)}
        onClose={() => setFilterPanel(false)}
      />

      <SearchInput
        size="medium"
        id="search-input"
        ref={searchInputRef}
        className={styles.largeSearchInput}
        placeholder="Поиск"
        value={searchState.searchQuery}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        onChange={(e) => {
          e.preventDefault();
          searchState.setSearch(e.target.value);
        }}
      />

      <Button variant="filter-2" className={`${styles.active}`} onClick={toggleFilterPanel}>
        {searchState.currentTab}
      </Button>
    </header>
  );
};

export default observer(SearchFoodControls);

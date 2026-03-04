import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react';
import clsx from 'clsx';
import styles from './SearchFoodControls.module.scss';

import SearchInput from '@/components/ui/atoms/input/SearchInput/SearchInput';
import { foodSearchConfing } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/config/config';
import { FilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { emitter } from '@/infrastructure/emitter/emitter';
import FilterPanel from '@/components/ui/FilterPanel/FilterPanel';
import { Button } from '@/components/ui/atoms/Button';
import { UseFilteringStateV2Return } from '@/components/features/shared/hooks/useFilteringStateV2';
import { SearchMode } from '@/components/features/builders/shared/components/SearchFood/SearchFood';
import { ButtonBack } from '@/components/ui/atoms/Button/ButtonBack';

type Tabs = 'продукты' | 'блюда';

type Props = {
  searchState: UseFilteringStateV2Return;
  className: string;
  onFocusChange?: (focused: boolean) => void;
  onOpen?: () => void;
  mode?: SearchMode;
  hasBackButton?: boolean;
};

const SearchFoodControls = ({ searchState, className, onFocusChange, onOpen, mode }: Props) => {
  const [filterPanel, setFilterPanel] = useState(false);
  const [selectedSubFilter, setSelectedSubFilter] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when modal opens - sync call for iOS/Android compatibility
  const handleOpen = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus({ preventScroll: true });
    }
    onOpen?.();
  };

  // Synchronous focus on mount - critical for iOS keyboard to appear
  useLayoutEffect(() => {
    searchInputRef.current?.focus({ preventScroll: true });
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
    () =>
      mode === 'products-only'
        ? []
        : [
            { value: 'продукты', label: 'Продукты' },
            { value: 'блюда', label: 'Блюда' },
          ],
    [mode]
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
      <ButtonBack onClick={() => emitter.emit('back')} />
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

      <Button variant="filter" className={`${styles.active}`} onClick={toggleFilterPanel}>
        {searchState.currentTab}
      </Button>
    </header>
  );
};

export default observer(SearchFoodControls);

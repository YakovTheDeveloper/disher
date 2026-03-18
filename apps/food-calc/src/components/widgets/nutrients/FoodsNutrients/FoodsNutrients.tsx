import { observer } from 'mobx-react-lite';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { Overlay } from '@/components/entities/nutrient/NutrientGroup/Overlay';
import { OpenDailyNorms } from '@/components/features/dailyNorms/OpenDailyNorms';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import { useMemo, useCallback } from 'react';
import { FilterButton } from '@/components/ui/atoms/Button';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';
import {
  useFilterNutrients,
  FilterNutrientsPanel,
  FilterNutrientCardWrapper,
} from '@/components/features/nutrients/filter-nutrients';
import { OpenRichFood } from '@/components/features/food/open-rich-food';
import styles from './FoodsNutrients.module.scss';
import { Ornament } from '@/components/ui/Ornament';
import type { ScheduleFood } from '@/entities/schedule-food';

type Props = {
  items: ScheduleFood[];
  after?: React.ReactNode;
};

const FoodsNutrients = ({ items, after }: Props) => {
  const filter = useFilterNutrients();
  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  // TODO: migrate — TotalNutrientsStore.setEntity expects an MST schedule model.
  // Need to adapt it to work with ScheduleFood[] array.
  // nutrientStore.setEntity(items);

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [isLoading]
  );

  const renderCard = useCallback(
    (nutrientData: {
      id: string;
      name: string;
      displayName: string;
      displayNameRu: string;
      unit: string;
      unitRu: string;
    }) => (
      <FilterNutrientCardWrapper
        isHidden={filter.isHidden(nutrientData.id)}
        filterMode={filter.filterMode}
        onToggle={() => filter.toggleHidden(nutrientData.id)}
        nutrientId={nutrientData.id}
        nutrientName={nutrientData.displayNameRu}
        actionSlot={
          <OpenRichFood nutrientId={nutrientData.id} nutrientName={nutrientData.displayNameRu} />
        }
      >
        <NutrientCardV2
          content={nutrientData}
          getValue={nutrientStore.getValue}
          renderOverlay={renderOverlay}
          showValues={filter.showValues}
          showProgress={filter.showProgress}
        />
      </FilterNutrientCardWrapper>
    ),
    [filter, nutrientStore.getValue, renderOverlay]
  );

  return (
    <Screen
      bottomRight={<FilterButton onClick={filter.toggleFilterMode} isActive={filter.filterMode} />}
      actions={
        filter.filterMode ? (
          <FilterNutrientsPanel
            showProgress={filter.showProgress}
            showValues={filter.showValues}
            onToggleProgress={filter.toggleShowProgress}
            onToggleValues={filter.toggleShowValues}
            onToggleFilterMode={filter.toggleFilterMode}
          />
        ) : (
          <div></div>
        )
      }
    >
      <Ornament text="нутриенты"></Ornament>

      <Nutrients
        store={nutrientStore}
        renderOverlay={renderOverlay}
        asControlledForm={false}
        renderCard={renderCard}
      />

      <Ornament text="дневная норма"></Ornament>
      <OpenDailyNorms />

      {after}

      {/* TODO: migrate — filter items without nutrient data from ScheduleFood[] */}
    </Screen>
  );
};

export default observer(FoodsNutrients);

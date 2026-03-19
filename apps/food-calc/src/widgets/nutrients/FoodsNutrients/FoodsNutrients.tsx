import { Screen } from '@/shared/ui/Screen';
import { Nutrients } from '@/entities/nutrient/ui/NutrientGroup';
import { OpenDailyNorms } from '@/features/dailyNorms/OpenDailyNorms';
import { useCallback } from 'react';
import { FilterButton } from '@/shared/ui/atoms/Button';
import NutrientCardV2 from '@/entities/nutrient/ui/NutrientCard/NutrientCardV2';
import {
  useFilterNutrients,
  FilterNutrientsPanel,
  FilterNutrientCardWrapper,
} from '@/features/nutrients/filter-nutrients';
import { OpenRichFood } from '@/features/food/open-rich-food';
import './FoodsNutrients.module.scss';
import { Ornament } from '@/shared/ui/Ornament';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import type { NutrientTotals } from '@/shared/lib/nutrients';

type Props = {
  totals: NutrientTotals;
  after?: React.ReactNode;
};

const FoodsNutrients = ({ totals, after }: Props) => {
  const filter = useFilterNutrients();
  const { getValue } = useNutrientTotals(totals);

  const renderCard = useCallback(
    (nutrientData: Nutrient) => (
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
          getValue={getValue}
          showValues={filter.showValues}
          showProgress={filter.showProgress}
        />
      </FilterNutrientCardWrapper>
    ),
    [filter, getValue]
  );

  return (
    <Screen
      offsetTop
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

      <Nutrients renderCard={renderCard} />

      <Ornament text="дневная норма"></Ornament>
      <OpenDailyNorms />

      {after}
    </Screen>
  );
};

export default FoodsNutrients;

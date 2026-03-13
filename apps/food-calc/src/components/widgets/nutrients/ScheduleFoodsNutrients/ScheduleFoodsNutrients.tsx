import { observer } from 'mobx-react-lite';
import { Instance } from 'mobx-state-tree';
import { ScheduleFoods } from '@/domain/schedule/scheduleFood';
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
import styles from './ScheduleFoodsNutrients.module.scss';
import { Ornament } from '@/components/ui/Ornament';

type Props = {
  schedule: Instance<typeof ScheduleFoods>;
  after?: React.ReactNode;
};

const ScheduleFoodsNutrients = ({ schedule, after }: Props) => {
  const filter = useFilterNutrients();
  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(schedule);

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

      {schedule.foodWithNoNutrients.length > 0 && (
        <div className={styles.messageContainer}>
          <p>Без продуктов</p>
          <div className={styles.messageContainerRow}>
            {schedule.foodWithNoNutrients.map((food) => (
              <span key={food.id}>{food.name}</span>
            ))}{' '}
          </div>
          <p>(нет данных по ценности)</p>
        </div>
      )}
    </Screen>
  );
};

export default observer(ScheduleFoodsNutrients);

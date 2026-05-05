import { Screen } from '@/shared/ui/Screen';
import { Nutrients } from '@/entities/nutrient/ui/NutrientGroup';
import { OpenDailyNorms } from '@/features/dailyNorms/OpenDailyNorms';
import { memo, useCallback } from 'react';
import clsx from 'clsx';
import { FilterButton } from '@/shared/ui/atoms/Button';
import { NutrientCard, NutrientCardEditor } from '@/entities/nutrient/ui/NutrientCard';
import type { NutrientCardEditorVariant } from '@/entities/nutrient/ui/NutrientCard';
import {
  useFilterNutrients,
  FilterNutrientsPanel,
  FilterNutrientCardWrapper,
} from '@/features/nutrients/filter-nutrients';
import OpenRichFood from './OpenRichFood';
import './FoodsNutrients.module.scss';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import styles from './FoodsNutrients.module.scss';
import NutrientDesignVariants from './NutrientDesignVariants';

type Props = {
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
  after?: React.ReactNode;
  className?: string;
  onRichFood?: (nutrientId: string, unit: string) => void;
  variant?: 'view' | 'edit-norms' | 'edit-values';
  cardVariant?: NutrientCardEditorVariant;
};

const FoodsNutrients = ({
  totals,
  missingNutrientNames = [],
  isLoading,
  after,
  className,
  onRichFood,
  variant = 'view',
  cardVariant,
}: Props) => {
  const filter = useFilterNutrients();
  const { getValue } = useNutrientTotals(totals);

  const renderCard = useCallback(
    (nutrientData: Nutrient) => (
      <FilterNutrientCardWrapper
        isHidden={filter.isHidden(nutrientData.id)}
        filterMode={filter.filterMode}
        onToggle={() => filter.toggleHidden(nutrientData.id)}
        nutrientId={nutrientData.id}
        nutrientKey={nutrientData.name}
        actionSlot={
          <OpenRichFood
            nutrientId={nutrientData.id}
            nutrientName={nutrientData.displayNameRu}
            nutrientUnit={nutrientData.unitRu}
            onRichFood={onRichFood}
          />
        }
        renderCard={(overrides) =>
          cardVariant ? (
            <NutrientCardEditor
              content={nutrientData}
              getValue={getValue}
              variant={cardVariant}
              {...overrides}
            />
          ) : (
            <NutrientCard content={nutrientData} getValue={getValue} {...overrides} />
          )
        }
      />
    ),
    [filter, getValue, onRichFood, cardVariant]
  );

  return (
    <Screen
      className={clsx(styles.frostedGlass, className)}
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
      <div className={styles.statusHeader}>{isLoading && <Spinner size={16} />}</div>
      <div className={styles.norms}>
        <OpenDailyNorms />
      </div>
      {/* <Ornament text="нутриенты"></Ornament> */}

      <div className={styles.nutrientsSection}>
        {cardVariant ? (
          <Nutrients renderCard={renderCard} />
        ) : (
          <NutrientDesignVariants getValue={getValue} variant={variant} onRichFood={onRichFood} />
        )}
      </div>

      {missingNutrientNames.length > 0 && (
        <p style={{ padding: '8px 16px', fontSize: 13, opacity: 0.5, lineHeight: 1.4 }}>
          Нет данных о нутриентах: {missingNutrientNames.join(', ')}
        </p>
      )}

      {after}
    </Screen>
  );
};

export default memo(FoodsNutrients);

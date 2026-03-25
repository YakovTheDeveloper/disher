import { Screen } from '@/shared/ui/Screen';
import { Nutrients } from '@/entities/nutrient/ui/NutrientGroup';
import { OpenDailyNorms } from '@/features/dailyNorms/OpenDailyNorms';
import { useCallback } from 'react';
import { FilterButton } from '@/shared/ui/atoms/Button';
import NutrientCardV3 from '@/entities/nutrient/ui/NutrientCard/NutrientCardV3';
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
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import styles from './FoodsNutrients.module.scss';
import treeSrc from '@/shared/assets/decarative/tree.png';

type Props = {
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
  after?: React.ReactNode;
};

const FoodsNutrients = ({ totals, missingNutrientNames = [], isLoading, after }: Props) => {
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
          <OpenRichFood nutrientId={nutrientData.id} nutrientName={nutrientData.displayNameRu} />
        }
        renderCard={(overrides) => (
          <NutrientCardV3 content={nutrientData} getValue={getValue} {...overrides} />
        )}
      />
    ),
    [filter, getValue]
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
      <div className={styles.statusHeader}>{isLoading && <Spinner size={16} />}</div>
      <Ornament text="нутриенты"></Ornament>

      <div className={styles.nutrientsSection}>
        <img src={treeSrc} alt="" className={styles.watermark} />
        <Nutrients renderCard={renderCard} titleVariant="v2" />
      </div>

      {missingNutrientNames.length > 0 && (
        <p style={{ padding: '8px 16px', fontSize: 13, opacity: 0.5, lineHeight: 1.4 }}>
          Нет данных о нутриентах: {missingNutrientNames.join(', ')}
        </p>
      )}

      <Ornament text="дневная норма"></Ornament>
      <OpenDailyNorms />

      {after}
    </Screen>
  );
};

export default FoodsNutrients;

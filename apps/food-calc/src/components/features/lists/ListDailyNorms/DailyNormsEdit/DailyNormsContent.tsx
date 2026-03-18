import styles from './DailyNormsContent.module.scss';

import type { DailyNorm } from '@/entities/daily-norm';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { Nutrient } from '@/components/entities/nutrient/NutrientGroup/constants';
import NutrientNormCard from '@/components/features/dailyNorms/change-daily-norm-nutrient-value/NutrientNormCard/NutrientNormCard';
import Nutrients from '@/components/entities/nutrient/NutrientGroup/Nutrients';

type Props = {
  variant: 'view' | 'modify';
  dailyNorm: DailyNorm;
};

const DailyNormsContent = ({ dailyNorm, variant }: Props) => {
  const readOnly = variant === 'view';

  const getNormValue = (id: string) => dailyNorm.nutrientIdToDailyNormItem.get(id)?.quantity ?? 0;

  const handleChange = (value: number, nutrientId: string) => {
    dailyNorm.changeNutrientValue(nutrientId, value);
  };

  const renderCard = (nutrient: Nutrient) => (
    <NutrientNormCard
      content={nutrient}
      getNormValue={getNormValue}
      onChange={handleChange}
      readOnly={readOnly}
    />
  );

  return (
    <section className={styles.dailyNormNutrients}>
      <Nutrients renderCard={renderCard} />
    </section>
  );
};

export default DailyNormsContent;

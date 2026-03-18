import styles from './DailyNormsContent.module.scss';

import type { DailyNorm } from '@/entities/daily-norm';
import { Nutrient } from '@/components/entities/nutrient/NutrientGroup/constants';
import NutrientNormCard from '@/components/features/dailyNorms/change-daily-norm-nutrient-value/NutrientNormCard/NutrientNormCard';
import Nutrients from '@/components/entities/nutrient/NutrientGroup/Nutrients';

type Props = {
  variant: 'view' | 'modify';
  dailyNorm: DailyNorm;
};

const DailyNormsContent = ({ dailyNorm, variant }: Props) => {
  const readOnly = variant === 'view';
  // TODO: migrate to Triplit — dailyNorm no longer has nutrientIdToDailyNormItem or changeNutrientValue
  const dn = dailyNorm as any;

  const getNormValue = (id: string) => dn.nutrientIdToDailyNormItem?.get(id)?.quantity ?? 0;

  const handleChange = (value: number, nutrientId: string) => {
    dn.changeNutrientValue?.(nutrientId, value);
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

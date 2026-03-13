import { observer } from 'mobx-react-lite';
import styles from './DailyNormsContent.module.scss';

import { DailyNorm } from '@/domain/dailyNorm/DailyNorm.model';
import { Instance } from 'mobx-state-tree';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { Nutrient, NutrientGroup, nutrientGroups } from '@/components/entities/nutrient/NutrientGroup/constants';
import NutrientNormCard from '@/components/features/dailyNorms/change-daily-norm-nutrient-value/NutrientNormCard/NutrientNormCard';

type Props = {
  variant: 'view' | 'modify';
  dailyNorm: Instance<typeof DailyNorm>;
};

const DailyNormsContent = ({ dailyNorm, variant }: Props) => {
  const readOnly = variant === 'view';

  const getNormValue = (id: string) =>
    dailyNorm.nutrientIdToDailyNormItem.get(id)?.quantity ?? 0;

  const handleChange = (value: number, nutrientId: string) => {
    dailyNorm.changeNutrientValue(nutrientId, value);
  };

  return (
    <section className={styles.dailyNormNutrients}>
      {nutrientGroups.map((group: NutrientGroup) => (
        <div className={styles.group} key={group.name}>
          <ScreenLabel variant="nutrients" className={styles.groupTitle}>
            {group.displayName}
          </ScreenLabel>
          <div className={styles.cards}>
            {group.content.map((nutrient: Nutrient) => (
              <NutrientNormCard
                key={nutrient.id}
                content={nutrient}
                getNormValue={getNormValue}
                onChange={handleChange}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default observer(DailyNormsContent);

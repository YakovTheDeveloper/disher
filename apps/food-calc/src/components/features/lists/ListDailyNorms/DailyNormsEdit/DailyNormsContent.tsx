import { observer } from 'mobx-react-lite';
import styles from './DailyNormsContent.module.scss';

import { ListItem } from '@/components/features/lists/ListDailyNorms/DailyNormsEdit/ListItem';
import { UserDailyNorm } from '@/domain/dailyNorm/DailyNorm.model';
import { Instance } from 'mobx-state-tree';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import {
  Nutrient,
  nutrientGroups,
} from '@/components/features/builders/TotalNutrients/Nutrients/constants';

type NutrientGroup = {
  name: string;
  displayName: string;
  content: Nutrient[];
};

type Props = {
  variant: 'view' | 'modify';
  dailyNorm: Instance<typeof UserDailyNorm>;
};

const DailyNormsContent = ({ dailyNorm, variant }: Props) => {
  return (
    <section className={styles.dailyNormNutrients}>
      {nutrientGroups.map((group: NutrientGroup) => (
        <div className={styles.group} key={group.name}>
          <ScreenLabel variant="nutrients" className={styles.groupTitle}>
            {group.displayName}
          </ScreenLabel>
          {group.content.map((nutrient) => {
            return (
              <ListItem
                key={nutrient.id}
                nutrient={nutrient}
                dailyNorm={dailyNorm}
                variant={variant}
              />
            );
          })}
        </div>
      ))}
    </section>
  );
};

export default observer(DailyNormsContent);

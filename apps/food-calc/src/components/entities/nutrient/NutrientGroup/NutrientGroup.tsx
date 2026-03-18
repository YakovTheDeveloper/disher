import { observer } from 'mobx-react-lite';
import styles from './NutrientGroup.module.scss';
import Nutrients from './Nutrients';
import { Instance } from 'mobx-state-tree';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import type { Nutrient } from './constants';

type Props = {
  store: Instance<typeof TotalNutrientsStore>;
  renderCard: (nutrientData: Nutrient) => React.ReactNode;
};

const NutrientGroup = (props: Props) => {
  return (
    <div className={styles.container}>
      <Nutrients {...props} />
    </div>
  );
};

export default observer(NutrientGroup);

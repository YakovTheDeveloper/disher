import { observer } from 'mobx-react-lite';
import styles from './NutrientGroup.module.scss';
import Nutrients from './Nutrients';
import { Instance } from 'mobx-state-tree';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';

type ConditionalProps =
  | {
      asControlledForm: true;
      onChange: (value: number, nutrientId: string) => void;
      getValue: (id: string) => number;
    }
  | {
      asControlledForm: false;
      onChange?: never;
      getValue?: never;
    };

type Props = {
  renderOverlay?: (percent: string) => React.ReactNode;
  store: Instance<typeof TotalNutrientsStore>;
} & ConditionalProps;

const NutrientGroup = (props: Props) => {
  return (
    <div className={styles.container}>
      <Nutrients {...props} />
    </div>
  );
};

export default observer(NutrientGroup);

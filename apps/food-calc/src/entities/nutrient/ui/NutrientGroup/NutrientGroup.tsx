import styles from './NutrientGroup.module.scss';
import Nutrients from './Nutrients';
import type { Nutrient } from './constants';

type Props = {
  renderCard: (nutrientData: Nutrient) => React.ReactNode;
};

const NutrientGroup = (props: Props) => {
  return (
    <div className={styles.container}>
      <Nutrients {...props} />
    </div>
  );
};

export default NutrientGroup;

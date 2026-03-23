import styles from './NutrientCardV3.module.scss';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';

interface Props {
  content: Nutrient;
  getValue: (id: string) => number;
  showPercent?: boolean;
  children?: React.ReactNode;
}

const NutrientCardV3 = ({
  content,
  getValue,
  showPercent = true,
  children,
}: Props) => {
  const {
    displayNameRu,
    value,
    unitRu,
    percentText,
    statusClass,
  } = useNutrientCard({ content, getValue });

  const { group } = content;
  return (
    <div className={clsx(styles.card, styles[group])}>
      <div className={styles.topRow}>
        <span className={styles.label}>{displayNameRu}</span>
      </div>
      <div className={styles.bottomRow}>
        <span className={styles.value}>{value.toFixed(1)} {unitRu}</span>
        {showPercent && (
          <span className={clsx(styles.percent, styles[statusClass])}>{percentText}%</span>
        )}
        {children}
      </div>
    </div>
  );
};

export default NutrientCardV3;

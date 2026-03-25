import styles from './NutrientCardV3.module.scss';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';

interface Props {
  content: Nutrient;
  getValue?: (id: string) => number;
  showValue?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const defaultGetValue = () => 0;

const NutrientCardV3 = ({
  content,
  getValue = defaultGetValue,
  showValue = true,
  dimmed = false,
  onClick,
  children,
  className,
}: Props) => {
  const {
    displayNameRu,
    value,
    unitRu,
    percentText,
    statusClass,
  } = useNutrientCard({ content, getValue });

  const { group } = content;
  const hasChildren = children !== undefined && children !== null;

  return (
    <div
      className={clsx(styles.card, styles[group], dimmed && styles.dimmed, className)}
      onClick={onClick}
    >
      <div className={styles.topRow}>
        <span className={styles.label}>{displayNameRu}</span>
      </div>
      <div className={styles.bottomRow}>
        {showValue && (
          <span className={styles.value}>{value.toFixed(1)} {unitRu}</span>
        )}
        {hasChildren ? (
          <div className={styles.rightSlot}>{children}</div>
        ) : (
          <span className={clsx(styles.percent, styles[statusClass])}>{percentText}%</span>
        )}
      </div>
    </div>
  );
};

export default NutrientCardV3;

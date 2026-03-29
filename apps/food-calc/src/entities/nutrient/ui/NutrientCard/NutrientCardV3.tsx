import styles from './NutrientCardV3.module.scss';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';

interface Props {
  content: Nutrient;
  getValue?: (id: string) => number;
  showValue?: boolean;
  showProgress?: boolean;
  dimmed?: boolean;
  asLabel?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const defaultGetValue = () => 0;

const NutrientCardV3 = ({
  content,
  getValue = defaultGetValue,
  showValue = true,
  showProgress = true,
  dimmed = false,
  asLabel = false,
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
    progressPercent,
  } = useNutrientCard({ content, getValue });

  const { group } = content;
  const hasChildren = children !== undefined && children !== null;

  const cardContent = (
    <>
      <div className={styles.topRow}>
        <span className={styles.label}>{displayNameRu}</span>
      </div>
      <div className={styles.bottomRow}>
        <span className={clsx(styles.value, !showValue && styles.valueHidden)}>
          {showValue ? <>{value.toFixed(1)} {unitRu}</> : '\u00A0'}
        </span>
        {hasChildren ? (
          <div className={styles.rightSlot}>{children}</div>
        ) : (
          <span className={clsx(styles.percent, styles[statusClass])}>{percentText}%</span>
        )}
      </div>
      {showProgress && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </>
  );

  const cardClass = clsx(styles.card, styles[group], dimmed && styles.dimmed, className);

  if (asLabel) {
    return (
      <label className={cardClass}>
        {cardContent}
      </label>
    );
  }

  return (
    <div className={cardClass} onClick={onClick}>
      {cardContent}
    </div>
  );
};

export default NutrientCardV3;

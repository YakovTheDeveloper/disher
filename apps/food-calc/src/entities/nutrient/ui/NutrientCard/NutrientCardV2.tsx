import styles from './NutrientCard.module.scss';
import { motion } from 'framer-motion';
import { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';

interface Props {
  content: Nutrient;
  getValue: (id: string) => number;
  showValues?: boolean;
  showProgress?: boolean;
  showPercent?: boolean;
  children?: React.ReactNode;
}

const NutrientCard = ({
  content,
  getValue,
  showValues: showValuesProp = true,
  showProgress: showProgressProp = true,
  showPercent = true,
  children,
}: Props) => {
  const {
    displayNameRu,
    unitRu,
    symbol,
    value,
    norm,
    progressPercent,
    percentText,
    statusClass,
  } = useNutrientCard({ content, getValue });

  const { group } = content;

  return (
    <div className={clsx(styles.card, styles[statusClass], styles[group])}>
      <div className={styles.topRow}>
        <div className={styles.leftColumn}>
          <span className={styles.symbol}>{symbol}</span>
          <span className={styles.name}>{displayNameRu}</span>
        </div>
        <div className={styles.statsColumn}>
          {showPercent && (
            <span className={clsx(styles.percent, styles[statusClass])}>{percentText}%</span>
          )}
          {children}
          {showValuesProp && (
            <div className={styles.valuesCompact}>
              <span>{value.toFixed(1)}</span>
              <span className={styles.separator}>/</span>
              <span>{norm}</span>
              <span className={styles.unit}>{unitRu}</span>
            </div>
          )}
        </div>
      </div>

      {showProgressProp && (
        <div className={styles.progressBar}>
          <motion.div
            className={clsx(styles.fill, styles[statusClass])}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  );
};

export default NutrientCard;

import { observer } from 'mobx-react-lite';
import styles2 from './NutrientCardCommon.module.scss';
import styles from './NutrientCard.module.scss';
import { motion } from 'framer-motion';
import {
  defaultDailyNorms,
  Nutrient,
} from '@/components/entities/nutrient/NutrientGroup/constants';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';

interface Props {
  content: Nutrient;
  renderOverlay?: (percent: string) => React.ReactNode;
  getValue: (id: string) => number;
  showValues?: boolean;
  showProgress?: boolean;
  showPercent?: boolean;
  children?: React.ReactNode;
}

const getRoundedPercent = (percentage: number) => {
  if (percentage < 1 && percentage > 0) {
    return percentage.toFixed(2);
  } else if (percentage < 10) {
    return percentage.toFixed(1);
  } else {
    return Math.round(percentage).toString();
  }
};

const getStatusClass = (p: number) => {
  if (p < 30) return 'low';
  if (p < 60) return 'medium';
  if (p <= 99) return 'optimal';
  return 'excess';
};

const NutrientCard = ({ content, getValue, showValues: showValuesProp = true, showProgress: showProgressProp = true, showPercent = true, children }: Props) => {
  const showValues = showValuesProp;
  const showProgress = showProgressProp;
  const showUnits = true;

  const { displayNameRu, id, unitRu, symbol, group } = content;
  const value = getValue(id);
  const norm = defaultDailyNorms[+id];

  const percent = norm > 0 ? (value / norm) * 100 : 0;
  const progressPercent = Math.min(100, percent);
  const percentText = getRoundedPercent(percent);
  const statusClass = getStatusClass(percent);

  return (
    <div className={clsx(styles.card, styles[statusClass], styles[group])}>
      <div className={styles.topRow}>
        <span className={styles.symbol}>{symbol}</span>
        <div className={styles.statsColumn}>
          {showPercent && <span className={clsx(styles.percent, styles[statusClass])}>{percentText}%</span>}
          {showValues && (
            <div className={styles.valuesCompact}>
              <span>{value.toFixed(1)}</span>
              <span className={styles.separator}>/</span>
              <span>{norm}</span>
              {showUnits && <span className={styles.unit}>{unitRu}</span>}
            </div>
          )}
        </div>
      </div>

      <div className={styles.center}>
        <span className={styles.name}>{displayNameRu}</span>
      </div>

      {showProgress && (
        <div className={styles.progressBar}>
          <motion.div
            className={clsx(styles.fill, styles[statusClass])}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}
      {children}
    </div>
  );
};

export default observer(NutrientCard);

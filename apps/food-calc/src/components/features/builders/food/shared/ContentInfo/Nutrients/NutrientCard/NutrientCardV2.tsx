import { observer } from 'mobx-react-lite';
import styles from './NutrientCardV2.module.scss';
import { motion } from 'framer-motion';
import {
  defaultDailyNorms,
  NutrientContentItem,
} from '@/components/features/builders/food/shared/ContentInfo/Nutrients/constants';
import clsx from 'clsx';

type Props = {
  content: NutrientContentItem;
  renderOverlay: ((percent: string) => React.ReactNode) | undefined;
  getValue: (id: string) => number;
};

const getRoundedPercent = (percentage: number) => {
  if (percentage < 1 && percentage > 0) {
    return percentage.toFixed(2);
  } else if (percentage < 10) {
    return percentage.toFixed(1);
  } else {
    return Math.round(percentage).toString();
  }
};

const NutrientCard = ({ content, getValue }: Props) => {
  const { displayNameRu, id, unitRu } = content;
  const value = getValue(id);
  const norm = defaultDailyNorms[+id];

  const percent = norm > 0 ? (value / norm) * 100 : 0;
  const progressPercent = Math.min(100, percent);
  const percentText = getRoundedPercent(percent);

  const getStatusClass = (p: number) => {
    if (p < 30) return styles.low;
    if (p < 85) return styles.medium;
    if (p <= 105) return styles.optimal;
    return styles.excess;
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.name}>{displayNameRu}</span>
        <span className={clsx([styles.percentValue, getStatusClass(percent)])}>{percentText}%</span>
      </div>

      <div className={styles.progressBarContainer}>
        <div className={styles.track}>
          <motion.div
            className={clsx([styles.fill, getStatusClass(percent)])}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <div className={styles.valuesInside}>
            <span className={styles.currentValue}>{value.toFixed(1)}</span>
            {/* <span className={styles.separator}>/</span> */}
            <span className={styles.normValue}>
              {norm} {unitRu}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(NutrientCard);

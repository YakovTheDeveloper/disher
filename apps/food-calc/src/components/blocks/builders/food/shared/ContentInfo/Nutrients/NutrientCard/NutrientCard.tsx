import { observer } from 'mobx-react-lite';
import styles from './NutrientCard.module.scss';
import { motion } from 'framer-motion';
import { NutrientData } from '@/types/nutrient/nutrient';
import { defaultDailyNorms } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/constants';
type Props = {
  content: NutrientData;
  renderOverlay: ((percent: string) => React.ReactNode) | undefined;
  getValue: (id: number) => number;
};

const getRoundedPercent = (percentage: number, quantity, norm) => {
  if (!quantity || !norm) return '';

  if (percentage < 1) {
    return percentage.toFixed(2);
  } else if (percentage < 10) {
    return percentage.toFixed(1);
  } else {
    return Math.round(percentage).toString();
  }
};

const NutrientCard = ({ content, renderOverlay, getValue }: Props) => {
  const { displayName, displayNameRu, id, name, unit, unitRu } = content;
  const value = getValue(id);
  const norm = defaultDailyNorms[id];
  const percent = Math.min(100, (value / norm) * 100);

  const percentNormalized = getRoundedPercent(percent, value, norm);
  const progressBarPercent = value ? percent : 0;

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.card}
    >
      <div className={styles.header}>
        <span className={styles.name}>{displayNameRu}</span>
        <span className={styles.value}>
          {unit} {value?.toFixed(1)} / {norm}
        </span>
        <span className={styles.percent}>
          {renderOverlay ? renderOverlay(percentNormalized) : percentNormalized}
        </span>
      </div>
      <div className={styles.progressWrapper}>
        <div className={styles.progress} style={{ width: `${progressBarPercent}%` }} />
      </div>
    </motion.div>
  );
};

export default observer(NutrientCard);

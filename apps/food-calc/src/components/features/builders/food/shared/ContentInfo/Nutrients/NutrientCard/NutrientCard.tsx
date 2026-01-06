import { observer } from 'mobx-react-lite';
import styles from './NutrientCard.module.scss';
import { motion } from 'framer-motion';
import { NutrientData } from '@/types/nutrient/nutrient';
import {
  defaultDailyNorms,
  NutrientContentItem,
} from '@/components/features/builders/food/shared/ContentInfo/Nutrients/constants';
type Props = {
  content: NutrientContentItem;
  renderOverlay: ((percent: string) => React.ReactNode) | undefined;
  getValue: (id: string) => number;
  progressType?: 'bar' | 'circle';
};

const getRoundedPercent = (percentage: number, quantity: number, norm: number) => {
  if (!quantity || !norm) return '';

  if (percentage < 1) {
    return percentage.toFixed(2);
  } else if (percentage < 10) {
    return percentage.toFixed(1);
  } else {
    return Math.round(percentage).toString();
  }
};

const NutrientCard = ({ content, renderOverlay, getValue, progressType = 'bar' }: Props) => {
  const { displayNameRu, id } = content;
  const value = getValue(id);

  console.log('NutrientCard', id, value);
  const norm = defaultDailyNorms[+id];
  const percent = Math.min(100, (value / norm) * 100);

  const percentNormalized = getRoundedPercent(percent, value, norm);
  const progressBarPercent = value ? percent : 0;

  if (progressType === 'bar')
    return (
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={styles.card}
      >
        <div className={styles.header}>
          <div className={styles.headerColumn}>
            <span className={styles.name}>{displayNameRu}</span>
            <span className={styles.value}>
              {value?.toFixed(1)} / {norm}
            </span>
          </div>
          <span className={styles.percent}>
            {renderOverlay ? renderOverlay(percentNormalized) : percentNormalized}
          </span>
        </div>
        <div className={styles.progressWrapper}>
          <div className={styles.progress} style={{ width: `${progressBarPercent}%` }} />
        </div>
      </motion.div>
    );

  return (
    <div className={styles.circleProgressWrapper}>
      <span className={styles.percent}>
        33%
        {renderOverlay ? renderOverlay(percentNormalized) : percentNormalized}
      </span>

      <svg className={styles.progressCircle} viewBox="0 0 36 36">
        <defs>
          <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#4cafef' }} />
            <stop offset="100%" style={{ stopColor: '#2196f3' }} />
          </linearGradient>
        </defs>
        <path
          className={styles.circleBg}
          d="M18,2.0845 a15.9155,15.9155 0 0,1 0,31.831 a15.9155,15.9155 0 0,1 0,-31.831"
        />
        <path
          className={styles.circle}
          stroke="url(#circleGrad)"
          strokeDasharray={`${progressBarPercent}, 100`}
          d="M18,2.0845 a15.9155,15.9155 0 0,1 0,31.831 a15.9155,15.9155 0 0,1 0,-31.831"
        />
        <text x="18" y="20.35" className={styles.circleText}>
          {value?.toFixed(1)} / {norm}
        </text>
      </svg>
      <span className={styles.name}>{displayNameRu}</span>
    </div>
  );
};

export default observer(NutrientCard);

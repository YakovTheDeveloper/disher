import { observer } from 'mobx-react-lite';
import styles from './NutrientCardCommon.module.scss';
import { motion } from 'framer-motion';
import { NutrientContentItem } from '@/components/features/builders/shared/ContentInfo/Nutrients/constants';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';

interface Props {
  content: NutrientContentItem;
  renderOverlay?: (percent: string) => React.ReactNode;
  getValue: (id: string) => number;
}

const NutrientCard = ({ content, getValue }: Props) => {
  const { displayNameRu, value, norm, progressPercent, percentText, statusClass, unitRu } =
    useNutrientCard({ content, getValue });

  return (
    <div className={clsx([styles.card, styles[statusClass]])}>
      <div className={styles.header}>
        <span className={styles.name}>{displayNameRu}</span>
        <span className={clsx([styles.percentValue, styles[statusClass]])}>{percentText}%</span>
      </div>

      <div className={styles.progressBarContainer}>
        <div className={styles.track}>
          <motion.div
            className={clsx([styles.fill, styles[statusClass]])}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <div className={clsx([styles.valuesInside, styles.valuesInside_noPointerEvents])}>
            <span className={styles.currentValue}>{value.toFixed(1)}</span>
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

import { observer } from 'mobx-react-lite';
import styles from './NutrientCardCommon.module.scss';
import { motion } from 'framer-motion';
import { NutrientContentItem } from '@/components/features/builders/food/shared/ContentInfo/Nutrients/constants';
import clsx from 'clsx';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { useNutrientCard } from './useNutrientCard';
import { useRef } from 'react';

interface Props {
  content: NutrientContentItem;
  renderOverlay?: (percent: string) => React.ReactNode;
  getValue: (id: string) => number;
  onChange: (value: number, nutrientId: string) => void;
}

const NutrientCardFormEntry = ({ content, getValue, onChange }: Props) => {
  const { displayNameRu, value, norm, progressPercent, percentText, statusClass, unitRu } =
    useNutrientCard({ content, getValue });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCardClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
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
          <div className={styles.valuesInside}>
            <NumberInput
              ref={inputRef}
              value={value}
              onChange={(value) => onChange(value, content.id)}
              className={styles.numberInput}
            />
            <span className={styles.normValue}>
              {norm} {unitRu}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(NutrientCardFormEntry);

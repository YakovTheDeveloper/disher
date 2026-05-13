import { FC, useId } from 'react';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';
import NutrientInput from './NutrientInput';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import styles from './NutrientCardEditor.module.scss';

export type NutrientCardEditorVariant = 'schedule' | 'dish' | 'product-edit' | 'product-view';

interface Props {
  content: Nutrient;
  getValue?: (id: string) => number;
  variant: NutrientCardEditorVariant;
  showValue?: boolean;
  showProgress?: boolean;
  dimmed?: boolean;
  className?: string;
  /** For product-edit: called when value changes */
  onValueChange?: (nutrientId: string, value: number) => void;
  /** Current editable value for product-edit */
  editValue?: number;
}

const defaultGetValue = () => 0;

const NutrientCardEditor: FC<Props> = ({
  content,
  getValue = defaultGetValue,
  variant,
  showValue = true,
  showProgress = true,
  dimmed = false,
  className,
  onValueChange,
  editValue = 0,
}) => {
  const {
    displayNameRu,
    id,
    unitRu,
    value,
    norm,
    percentText,
    statusClass,
    progressPercent,
  } = useNutrientCard({ content, getValue });

  const { group } = content;
  const isProductEdit = variant === 'product-edit';

  // --- product-edit: input focus via label ---
  const editInputId = useId();

  // --- product-edit variant ---
  if (isProductEdit) {
    return (
      <label
        htmlFor={editInputId}
        className={clsx(styles.card, styles.productEdit, styles[group], dimmed && styles.dimmed, className)}
      >
        <span className={styles.name}>{displayNameRu}</span>
        <div className={styles.editValueSlot}>
          <NutrientInput
            id={editInputId}
            value={editValue}
            onChange={(v) => onValueChange?.(id, v)}
            unit={unitRu}
            norm={norm}
          />
        </div>
      </label>
    );
  }

  // --- schedule / dish / product-view variants ---
  return (
    <div className={clsx(styles.card, styles[group], dimmed && styles.dimmed, className)}>
      <div className={styles.topRow}>
        <span className={styles.label}>{displayNameRu}</span>
      </div>
      <div className={styles.bottomRow}>
        <span className={clsx(styles.value, !showValue && styles.valueHidden)}>
          {showValue ? <>{value.toFixed(1)} {unitRu}</> : ' '}
        </span>
        <span className={styles.percentLabel}>
          <span className={clsx(styles.percent, styles[statusClass])}>{percentText}%</span>
        </span>
      </div>
      {showProgress && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default NutrientCardEditor;

import { FC, useId } from 'react';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';
import NutrientInput from './NutrientInput';
import { Text, Numeral } from '@/shared/ui/atoms/Typography';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';
import styles from './NutrientCardEditor.module.scss';
import { formatAmount } from '@/shared/lib/formatNumber';

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
    percentText,
    statusClass,
    progressPercent,
    hasNorm,
  } = useNutrientCard({ content, getValue });

  const { group } = content;
  const isProductEdit = variant === 'product-edit';

  // --- product-edit: input focus via label ---
  const editInputId = useId();

  if (isProductEdit) {
    return (
      <label
        htmlFor={editInputId}
        className={clsx(styles.card, styles.productEdit, styles[group], dimmed && styles.dimmed, className)}
      >
        <Text as="span" role="caption" className={styles.name}>{displayNameRu}</Text>
        <div className={styles.editValueSlot}>
          <NutrientInput
            id={editInputId}
            value={editValue}
            onChange={(v) => onValueChange?.(id, v)}
            unit={unitRu}
          />
        </div>
      </label>
    );
  }

  // --- schedule / dish / product-view variants ---
  return (
    <div className={clsx(styles.card, styles[group], dimmed && styles.dimmed, className)}>
      <div className={styles.topRow}>
        <Text as="span" role="caption" className={styles.label}>{displayNameRu}</Text>
      </div>
      <div className={styles.bottomRow}>
        <Text as="span" role="caption" className={clsx(styles.value, !showValue && styles.valueHidden)}>
          {showValue ? <>{formatAmount(value)} {unitRu}</> : ' '}
        </Text>
        {hasNorm && (
          <span className={styles.percentLabel}>
            <Numeral as="span" size="display" weight="thin" className={clsx(styles.percent, styles[statusClass])}>{percentText}%</Numeral>
          </span>
        )}
      </div>
      {showProgress && hasNorm && (
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

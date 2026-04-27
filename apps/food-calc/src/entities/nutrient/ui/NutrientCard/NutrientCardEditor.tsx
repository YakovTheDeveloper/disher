import { FC, useCallback, useId, useState } from 'react';
import clsx from 'clsx';
import { useNutrientCard } from './useNutrientCard';
import NutrientInput from './NutrientInput';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import {
  useDailyNorm,
  setDailyNormNutrient,
  DEFAULT_NORM_ID,
  DEFAULT_NORM,
  type DailyNormItems,
} from '@/entities/daily-norm';
import { safeMutate } from '@/shared/lib/safeMutate';
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

  // --- norm editing modal (for non product-edit variants) ---
  const normInputId = useId();
  const [normModalOpen, setNormModalOpen] = useState(false);
  const [normDraft, setNormDraft] = useState(0);
  const defaultNorm = useDailyNorm(DEFAULT_NORM_ID);
  const dailyNorm = defaultNorm ?? DEFAULT_NORM;

  const getNormItems = useCallback(() => {
    return (typeof dailyNorm.items === 'string'
      ? JSON.parse(dailyNorm.items)
      : dailyNorm.items ?? {}) as DailyNormItems;
  }, [dailyNorm.items]);

  const getCurrentNormValue = useCallback(() => {
    return getNormItems()[id] ?? 0;
  }, [id, getNormItems]);

  const handleNormFocus = useCallback(() => {
    setNormDraft(getCurrentNormValue());
    setNormModalOpen(true);
  }, [getCurrentNormValue]);

  const handleNormSave = useCallback(() => {
    const items = getNormItems();
    void safeMutate(
      () => setDailyNormNutrient(dailyNorm.id, id, normDraft || null, items),
      'Не удалось сохранить норму'
    );
    setNormModalOpen(false);
  }, [id, normDraft, dailyNorm, getNormItems]);

  const handleNormChange = useCallback((val: number) => {
    setNormDraft(val);
  }, []);

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
    <div
      className={clsx(styles.card, styles[group], dimmed && styles.dimmed, className)}
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement).id === normInputId) {
          handleNormFocus();
        }
      }}
    >
      <div className={styles.topRow}>
        <span className={styles.label}>{displayNameRu}</span>
      </div>
      <div className={styles.bottomRow}>
        <span className={clsx(styles.value, !showValue && styles.valueHidden)}>
          {showValue ? <>{value.toFixed(1)} {unitRu}</> : ' '}
        </span>
        <label htmlFor={normInputId} className={styles.percentLabel}>
          <span className={clsx(styles.percent, styles[statusClass])}>{percentText}%</span>
        </label>
      </div>
      {showProgress && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Norm edit modal */}
      <ModalByLabel
        isExpanded={normModalOpen}
        position="fixed"
        content={
          <div className={styles.normModal}>
            <div className={styles.normModalHeader}>
              <span className={styles.normModalTitle}>{displayNameRu}</span>
              <button
                className={styles.normModalClose}
                onClick={handleNormSave}
              >
                Готово
              </button>
            </div>
            <div className={styles.normModalBody}>
              <NutrientInput
                id={normInputId}
                value={normModalOpen ? normDraft : getCurrentNormValue()}
                onChange={handleNormChange}
                unit={unitRu}
                norm={undefined}
              />
            </div>
          </div>
        }
      />
    </div>
  );
};

export default NutrientCardEditor;

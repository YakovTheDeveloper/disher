import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { SelectableListItem } from '@/features/shared/selectable-list-item';
import styles from './FreeTextFoodReviewItem.module.scss';

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

export type ReviewEditTarget = 'time' | 'search' | 'quantity' | 'details';

export type ReviewItemVariant = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';

interface FreeTextFoodReviewItemProps {
  uid: string;
  item: {
    name: string;
    note: string;
    originalName: string;
    quantity: number;
    time: string;
    quantityGuessed?: boolean;
    productId?: string;
  };
  isAmbiguous?: boolean;
  isUnresolved?: boolean;
  candidates?: MatchCandidate[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  onStartEdit: (uid: string, step: ReviewEditTarget) => void;
  onDeleteNote?: () => void;
  onDeleteItem?: () => void;
  hideTime?: boolean;
  timeInputId: string;
  quantityInputId: string;
  detailsInputId: string;
  variant?: ReviewItemVariant;
}

// Status palettes — overrides for the time-of-day CSS vars consumed by
// SelectableListItem. Keys mirror what SelectableListItem.module.scss reads.
const STATUS_PALETTE = {
  resolved: {
    '--tod-bg-from': '#fafaf7',
    '--tod-bg-to': '#f3f3ee',
    '--tod-outline-from': '#e8e6df',
    '--tod-outline-to': '#dcd9d1',
    '--tod-tapped': '#ebeae3',
  },
  ambiguous: {
    '--tod-bg-from': '#fef6dc',
    '--tod-bg-to': '#fbecbd',
    '--tod-outline-from': '#f3d97a',
    '--tod-outline-to': '#e8c652',
    '--tod-tapped': '#fae6a8',
  },
  unresolved: {
    '--tod-bg-from': '#fde4dc',
    '--tod-bg-to': '#fbd3c5',
    '--tod-outline-from': '#f0a78f',
    '--tod-outline-to': '#e08c70',
    '--tod-tapped': '#fac9b6',
  },
} as const;

export const FreeTextFoodReviewItem = ({
  uid,
  item,
  isAmbiguous,
  isUnresolved,
  onStartEdit,
  onDeleteNote,
  onDeleteItem,
  hideTime,
  timeInputId,
  quantityInputId,
  detailsInputId,
}: FreeTextFoodReviewItemProps) => {
  const hasNote = item.note.trim().length > 0;
  const showOriginalFallback = isUnresolved && !item.productId;
  const showOriginalHint =
    !showOriginalFallback &&
    (isAmbiguous || isUnresolved) &&
    item.originalName.trim() !== '' &&
    item.originalName.trim().toLowerCase() !== item.name.trim().toLowerCase();

  const statusKey = isUnresolved ? 'unresolved' : isAmbiguous ? 'ambiguous' : 'resolved';
  const paletteStyle = STATUS_PALETTE[statusKey] as CSSProperties;

  return (
    <SelectableListItem
      id={uid}
      isSelectMode={false}
      isSelected={false}
      onSelect={() => {}}
      style={paletteStyle}
      innerClassName={styles.inner}
    >
      <div className={styles.row}>
        {/* Time */}
        {hideTime ? null : (
          <label
            htmlFor={timeInputId}
            className={styles.timeBtn}
            onMouseDown={() => onStartEdit(uid, 'time')}
            onTouchStart={() => onStartEdit(uid, 'time')}
          >
            {item.time || '—'}
          </label>
        )}

        {/* Name + (optional original hint) + note */}
        <div className={styles.nameCell}>
          <button
            type="button"
            className={styles.nameBtn}
            onClick={() => onStartEdit(uid, 'search')}
            title="Заменить продукт"
          >
            <span
              className={clsx(styles.name, showOriginalFallback && styles.nameOriginal)}
            >
              {showOriginalFallback ? item.originalName : item.name}
            </span>
          </button>

          {showOriginalHint && (
            <span className={styles.nameOriginal}>«{item.originalName}»</span>
          )}

          {hasNote ? (
            <label
              htmlFor={detailsInputId}
              className={styles.noteChip}
              onMouseDown={() => onStartEdit(uid, 'details')}
              onTouchStart={() => onStartEdit(uid, 'details')}
              title="Изменить заметку"
            >
              <span className={styles.noteText}>{item.note}</span>
              <button
                type="button"
                className={styles.noteClose}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteNote?.();
                }}
                aria-label="Убрать уточнение"
              >
                ×
              </button>
            </label>
          ) : null}
        </div>

        {/* Quantity */}
        <label
          htmlFor={quantityInputId}
          className={styles.qtyBtn}
          onMouseDown={() => onStartEdit(uid, 'quantity')}
          onTouchStart={() => onStartEdit(uid, 'quantity')}
        >
          <span className={styles.qtyText}>{item.quantity}</span>
          <span className={styles.qtyUnit}>г</span>
          {item.quantityGuessed && <span className={styles.qtyGuessed}>оценено</span>}
        </label>

        {/* Delete */}
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={onDeleteItem}
          aria-label="Удалить"
        >
          ×
        </button>
      </div>
    </SelectableListItem>
  );
};

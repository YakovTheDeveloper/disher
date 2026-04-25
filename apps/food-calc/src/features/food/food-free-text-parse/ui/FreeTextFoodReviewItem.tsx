import { useState } from 'react';
import clsx from 'clsx';
import styles from './FreeTextFoodReviewItem.module.scss';

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

export type ReviewEditTarget = 'time' | 'search' | 'quantity' | 'details';

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
}

export const FreeTextFoodReviewItem = ({
  uid,
  item,
  isAmbiguous,
  isUnresolved,
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  onStartEdit,
  onDeleteNote,
  onDeleteItem,
  hideTime,
  timeInputId,
  quantityInputId,
  detailsInputId,
}: FreeTextFoodReviewItemProps) => {
  const [expandCandidates, setExpandCandidates] = useState(false);

  const hasNote = item.note.trim().length > 0;
  const showOriginalFallback = isUnresolved && !item.productId;

  return (
    <div className={styles.wrapper}>
      <div
        className={clsx(
          styles.inner,
          isAmbiguous && styles.inner_ambiguous,
          isUnresolved && styles.inner_unresolved,
        )}
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

          {/* Name + note */}
          <div className={styles.nameCell}>
            <button
              type="button"
              className={styles.nameBtn}
              onClick={() => onStartEdit(uid, 'search')}
              title="Заменить продукт"
            >
              {(isAmbiguous || isUnresolved) && (
                <span
                  className={clsx(
                    styles.statusDot,
                    isAmbiguous && styles.statusDot_ambiguous,
                    isUnresolved && styles.statusDot_unresolved,
                  )}
                />
              )}
              <span
                className={clsx(styles.name, showOriginalFallback && styles.nameOriginal)}
              >
                {showOriginalFallback ? item.originalName : item.name}
              </span>
            </button>

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

        {/* Row 2: actions (ambiguous / unresolved) */}
        {(isAmbiguous || showOriginalFallback) && (
          <div className={styles.actionsRow}>
            {isAmbiguous && candidates && candidates.length > 0 && (
              <button
                type="button"
                className={styles.chipBtn}
                onClick={() => setExpandCandidates((v) => !v)}
              >
                {expandCandidates ? 'Скрыть варианты' : `Варианты (${candidates.length})`}
              </button>
            )}
            {showOriginalFallback && (
              <button
                type="button"
                className={styles.chipBtn}
                onClick={() => onStartEdit(uid, 'search')}
              >
                Найти продукт
              </button>
            )}
          </div>
        )}

        {/* Candidates panel */}
        {isAmbiguous && expandCandidates && candidates && (
          <div className={styles.candidatesPanel}>
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                className={clsx(
                  styles.candidate,
                  c.id === selectedCandidateId && styles.candidate_active,
                )}
                onClick={() => {
                  onSelectCandidate?.(c.id);
                  setExpandCandidates(false);
                }}
              >
                <span>{c.name}</span>
                <span className={styles.candidateScore}>{c.score.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

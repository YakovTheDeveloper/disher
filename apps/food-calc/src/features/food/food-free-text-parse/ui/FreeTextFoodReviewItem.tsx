import { useState } from 'react';
import clsx from 'clsx';
import TimeChoose from '@/shared/ui/TimeChoose/TimeChoose';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import ModalConfirmation from '@/shared/ui/Modal/ModalConfirmation/ModalConfirmation';
import { openFreeTextFoodSearch } from './openFreeTextFoodSearch';
import styles from './FreeTextFoodReviewItem.module.scss';

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

type ConfirmDeleteProps = BaseModalProps<boolean> & { action: string };

const ConfirmDeleteModal = ({ onClose, action }: ConfirmDeleteProps) => (
  <ModalLayout>
    <ModalConfirmation
      data={{ action }}
      onConfirm={() => onClose(true)}
      onClose={() => onClose(false)}
    />
  </ModalLayout>
);

interface FreeTextFoodReviewItemProps {
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
  onEditTime?: (time: string) => void;
  onEditFood?: (productId: string, name: string) => void;
  onEditQuantity?: (quantity: number) => void;
  onDeleteNote?: () => void;
  onDeleteItem?: () => void;
  onFindManually?: () => void;
  hideTime?: boolean;
}

export const FreeTextFoodReviewItem = ({
  item,
  isAmbiguous,
  isUnresolved,
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  onEditTime,
  onEditFood,
  onEditQuantity,
  onDeleteNote,
  onDeleteItem,
  onFindManually,
  hideTime,
}: FreeTextFoodReviewItemProps) => {
  const [expandCandidates, setExpandCandidates] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState<string>(String(item.quantity));

  const hasNote = item.note.trim().length > 0;
  const showOriginalFallback = isUnresolved && !item.productId;

  const handlePickFood = async () => {
    const picked = await openFreeTextFoodSearch(item.originalName || item.name);
    if (picked) onEditFood?.(picked.id, picked.name);
  };

  const commitQty = () => {
    const n = Math.max(1, Math.min(9999, parseInt(qtyDraft, 10) || item.quantity));
    onEditQuantity?.(n);
    setEditingQty(false);
  };

  const handleDelete = async () => {
    const confirmed = await modalStore.show(ConfirmDeleteModal, {
      action: 'удалить этот продукт?',
    });
    if (confirmed) onDeleteItem?.();
  };

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
          {hideTime ? null : editingTime ? (
            <div className={styles.timeEdit}>
              <TimeChoose
                initialTime={item.time}
                onFinish={(newTime: string) => {
                  onEditTime?.(newTime);
                  setEditingTime(false);
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              className={styles.timeBtn}
              onClick={() => setEditingTime(true)}
            >
              {item.time || '—'}
            </button>
          )}

          {/* Name + note */}
          <div className={styles.nameCell}>
            <button
              type="button"
              className={styles.nameBtn}
              onClick={handlePickFood}
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

            {hasNote && (
              <button
                type="button"
                className={styles.noteChip}
                onClick={onDeleteNote}
                title="Убрать уточнение"
              >
                <span className={styles.noteText}>{item.note}</span>
                <span className={styles.noteClose}>×</span>
              </button>
            )}
          </div>

          {/* Quantity */}
          {editingQty ? (
            <div className={styles.qtyEdit}>
              <input
                type="number"
                inputMode="numeric"
                value={qtyDraft}
                onChange={(e) => setQtyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitQty();
                  if (e.key === 'Escape') setEditingQty(false);
                }}
                onBlur={commitQty}
                autoFocus
                className={styles.qtyInput}
                min={1}
                max={9999}
              />
              <button type="button" className={styles.qtyDone} onClick={commitQty}>
                OK
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => {
                setQtyDraft(String(item.quantity));
                setEditingQty(true);
              }}
            >
              <span className={styles.qtyText}>{item.quantity}</span>
              <span className={styles.qtyUnit}>г</span>
              {item.quantityGuessed && <span className={styles.qtyGuessed}>оценено</span>}
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
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
              <button type="button" className={styles.chipBtn} onClick={onFindManually}>
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

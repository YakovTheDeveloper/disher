import { useEffect, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Text, QuietLabel } from '@/shared/ui/atoms/Typography';
import { LongPressRow } from '@/features/shared/long-press-item';
import { InlineTimeEditor } from '@/shared/ui/TimeChoose';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import styles from './ProposalFoodItem.module.scss';

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

export interface ProposalFoodItemProps {
  uid: string;
  item: {
    name: string;
    details: string;
    originalName: string;
    quantity: number;
    time: string;
    productId?: string;
  };
  isAmbiguous?: boolean;
  isUnresolved?: boolean;
  wasRescued?: boolean;
  candidates?: MatchCandidate[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  onCommitTime: (uid: string, time: string) => void;
  onCommitQuantity: (uid: string, quantity: number) => void;
  hideTime?: boolean;
  searchInputId: string;
  /** CSSProperties (`--tod-*` / `--accent-stripe`) → LongPressRow surface. */
  paletteStyle?: CSSProperties;
}

export const ProposalFoodItem = ({
  uid,
  item,
  isAmbiguous,
  isUnresolved,
  wasRescued,
  onCommitTime,
  onCommitQuantity,
  hideTime,
  searchInputId,
  paletteStyle,
}: ProposalFoodItemProps) => {
  const showOriginalFallback = isUnresolved && !item.productId;
  const showOriginalHint =
    !showOriginalFallback &&
    (isAmbiguous || isUnresolved || wasRescued) &&
    item.originalName.trim() !== '' &&
    item.originalName.trim().toLowerCase() !== item.name.trim().toLowerCase();

  // ── Inline qty edit (same flow as ScheduleFoodItemInline) ──────
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState(item.quantity);
  const [qtyPending, setQtyPending] = useState<number | null>(null);

  useEffect(() => {
    if (!editingQty) setQtyDraft(item.quantity);
  }, [item.quantity, editingQty]);

  useEffect(() => {
    if (qtyPending !== null && qtyPending === item.quantity) setQtyPending(null);
  }, [qtyPending, item.quantity]);

  const commitQty = () => {
    if (qtyDraft === item.quantity || qtyDraft <= 0) {
      setEditingQty(false);
      setQtyDraft(item.quantity);
      return;
    }
    setQtyPending(qtyDraft);
    onCommitQuantity(uid, qtyDraft);
    setEditingQty(false);
  };

  const qtyDisplay = qtyPending ?? item.quantity;
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // ScheduleFoodItemInline-style: pointerdown ТОЛЬКО stash'ит uid в dataset
  // input'а. Родитель (InlineWriteFoodReview.handleReviewFocusCapture) читает
  // его при focus event и вызывает startEdit. КРИТИЧНО: state update НЕ
  // здесь, иначе ModalByLabel expand'ится между pointerdown и pointerup, и
  // native click приземляется по координатам на back-button SearchFood
  // (который только что появился сверху-слева expanded модалки) → onBack →
  // closeEdit. Stash → focus → startEdit: модалка expand'ится ПОСЛЕ того
  // как click уже отработал на label-делегированный input.
  const handleNamePointerDown = () => {
    const trigger = document.getElementById(searchInputId);
    if (trigger) trigger.dataset.activeItemUid = uid;
  };

  // FoodName ожидает content={name} | null — оборачиваем строку.
  const nameContent = { name: showOriginalFallback ? item.originalName : item.name };

  return (
    <LongPressRow
      id={uid}
      className={styles.group}
      style={paletteStyle}
    >
      {hideTime ? (
        <span />
      ) : (
        <InlineTimeEditor
          value={item.time || '00:00'}
          onCommit={(time) => onCommitTime(uid, time)}
          displayClassName={styles.timeDisplay}
          editClassName={styles.timeEdit}
        />
      )}

      <span className={styles.foodCol} onPointerDown={handleNamePointerDown}>
        <FoodName
          content={nameContent}
          className={clsx(showOriginalFallback && styles.nameOriginal)}
          htmlFor={searchInputId}
        />
        {showOriginalHint && (
          <Text as="span" role="caption" className={styles.nameOriginalHint}>
            «{item.originalName}»
          </Text>
        )}
        {item.details ? (
          <QuietLabel className={styles.detailsSubtitle}>{item.details}</QuietLabel>
        ) : null}
      </span>

      <div className={styles.rightStack}>
        {editingQty ? (
          <span
            className={styles.qtyEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.querySelector('input')?.blur();
              } else if (e.key === 'Escape') {
                setQtyDraft(item.quantity);
                setEditingQty(false);
              }
            }}
          >
            <NumberInput
              ref={qtyInputRef}
              value={qtyDraft}
              onChange={setQtyDraft}
              onBlur={commitQty}
              autoFocus
              min={1}
              maxLength={4}
            />
            <span className={styles.qtyUnit}>г</span>
          </span>
        ) : (
          <span className={styles.qtyEdit} onClick={() => setEditingQty(true)}>
            {qtyDisplay}
            <span className={styles.qtyUnit}>г</span>
          </span>
        )}
      </div>
    </LongPressRow>
  );
};

export default ProposalFoodItem;

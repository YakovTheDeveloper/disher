import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { SelectableListItem } from '@/features/shared/selectable-list-item';
import { InlineTimeEditor } from '@/shared/ui/TimeChoose';
import NumberInput from '@/shared/ui/atoms/input/NumberInput/NumberInput';
import { PlusIcon } from '@/shared/ui/atoms/Button/AddButton/AddButton';
import styles from './FreeTextFoodReviewItem.module.scss';

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

export type ReviewEditTarget = 'search' | 'details';

interface FreeTextFoodReviewItemProps {
  uid: string;
  item: {
    name: string;
    details: string;
    originalName: string;
    quantity: number;
    time: string;
    quantityGuessed?: boolean;
    productId?: string;
  };
  isAmbiguous?: boolean;
  isUnresolved?: boolean;
  /**
   * Ряд был unresolved, но юзер «спас» его через AddToListPopover
   * (`u.manual` выставлен) — палитра уже resolved (warm peach), но
   * показываем chip с оригинальным вводом, чтобы юзер помнил «я это
   * подвязал руками». Иначе rescued-ряд неотличим от обычного resolved
   * + секция всё равно говорит «Не распознано».
   */
  wasRescued?: boolean;
  candidates?: MatchCandidate[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  onStartEdit: (uid: string, step: ReviewEditTarget) => void;
  onDeleteNote?: () => void;
  onDeleteItem?: () => void;
  onCommitTime: (uid: string, time: string) => void;
  onCommitQuantity: (uid: string, quantity: number) => void;
  onClickRescue?: (uid: string, anchor: HTMLElement) => void;
  hideTime?: boolean;
  searchInputId: string;
  detailsInputId: string;
}

// Per-group palette — overrides --tod-* CSS-vars read by SelectableListItem.
// + --accent-stripe is the 3px vertical bar on .inner::before.
//
// resolved (incl. rescued unresolved with manual)  → warm peach-honey (calm)
// ambiguous                                        → day-honey (attention)
// unresolved (no manual)                           → coral-rose (problem)
const STATUS_PALETTE = {
  resolved: {
    '--tod-bg-from': '#fffaf0',
    '--tod-bg-to': '#fcefd8',
    '--tod-outline-from': '#f3dca8',
    '--tod-outline-to': '#e8c887',
    '--tod-tapped': '#fbe4c0',
    '--accent-stripe': '#f0c850',
  },
  ambiguous: {
    '--tod-bg-from': '#fff8e0',
    '--tod-bg-to': '#fbecbd',
    '--tod-outline-from': '#f3d97a',
    '--tod-outline-to': '#e8c652',
    '--tod-tapped': '#fae6a8',
    '--accent-stripe': '#d99c2a',
  },
  unresolved: {
    '--tod-bg-from': '#fde4dc',
    '--tod-bg-to': '#fbd3c5',
    '--tod-outline-from': '#f0a78f',
    '--tod-outline-to': '#e08c70',
    '--tod-tapped': '#fac9b6',
    '--accent-stripe': '#c47a5a',
  },
} as const;

export const FreeTextFoodReviewItem = ({
  uid,
  item,
  isAmbiguous,
  isUnresolved,
  wasRescued,
  onStartEdit,
  onDeleteItem,
  onCommitTime,
  onCommitQuantity,
  onClickRescue,
  hideTime,
  searchInputId,
  detailsInputId,
}: FreeTextFoodReviewItemProps) => {
  const hasNote = item.details.trim().length > 0;
  const showOriginalFallback = isUnresolved && !item.productId;
  const showOriginalHint =
    !showOriginalFallback &&
    (isAmbiguous || isUnresolved || wasRescued) &&
    item.originalName.trim() !== '' &&
    item.originalName.trim().toLowerCase() !== item.name.trim().toLowerCase();

  const statusKey = isUnresolved
    ? 'unresolved'
    : isAmbiguous
      ? 'ambiguous'
      : 'resolved';
  const paletteStyle = STATUS_PALETTE[statusKey] as CSSProperties;

  // Show rescue button only when row is truly unresolved (no manual yet).
  const showRescueBtn = !!(isUnresolved && !item.productId && onClickRescue);

  const rescueAnchorRef = useRef<HTMLButtonElement>(null);

  // ── Inline quantity edit ────────────────────────────────────────
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
        {/* Time (inline) */}
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

        {/* Name + (optional original hint) + details */}
        <div className={styles.nameCell}>
          <label
            htmlFor={searchInputId}
            className={styles.nameBtn}
            onMouseDown={() => onStartEdit(uid, 'search')}
            onTouchStart={() => onStartEdit(uid, 'search')}
            title="Заменить продукт"
          >
            <span
              className={clsx(styles.name, showOriginalFallback && styles.nameOriginal)}
            >
              {showOriginalFallback ? item.originalName : item.name}
            </span>
          </label>

          {showOriginalHint && (
            <span className={styles.nameOriginalHint}>«{item.originalName}»</span>
          )}

          {hasNote && (
            <label
              htmlFor={detailsInputId}
              className={styles.detailsSubtitle}
              onMouseDown={() => onStartEdit(uid, 'details')}
              onTouchStart={() => onStartEdit(uid, 'details')}
              title="Изменить заметку"
            >
              {item.details}
            </label>
          )}
        </div>

        {/* Quantity (inline) */}
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
          <span
            className={styles.qtyEdit}
            onClick={() => setEditingQty(true)}
          >
            {qtyDisplay}
            <span className={styles.qtyUnit}>г</span>
            {item.quantityGuessed && (
              <span className={styles.qtyGuessed}>оценено</span>
            )}
          </span>
        )}

        {/* Rescue (+) — only on unresolved without manual */}
        {showRescueBtn ? (
          <button
            ref={rescueAnchorRef}
            type="button"
            className={styles.rescueBtn}
            onClick={() => {
              if (rescueAnchorRef.current) {
                onClickRescue?.(uid, rescueAnchorRef.current);
              }
            }}
            aria-label="Добавить в свой список"
            title="Добавить в свой список"
          >
            <PlusIcon />
          </button>
        ) : (
          <span />
        )}

        {/* Delete (×) */}
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

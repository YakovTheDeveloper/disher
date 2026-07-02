import { type CSSProperties } from 'react';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography';
import { FoodEntryCard } from '@/shared/ui/atoms/FoodEntryCard';
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

  // «оригинал» тихой строкой ПОД именем (FoodEntryCard.belowName) — proposal-only
  // довесок; вес/размер несёт <Text role="caption">, цвет/раскладку — nameOriginalHint.
  const belowName = showOriginalHint ? (
    <Text as="span" role="caption" className={styles.nameOriginalHint}>
      «{item.originalName}»
    </Text>
  ) : undefined;

  // Тонкий контейнер: мапим item предложки + коммиты в общий FoodEntryCard. Статус-
  // палитра (paletteStyle) и rescue/delete (в InlineWriteFoodReview, СНАРУЖИ) — как были.
  // dataEntityEdit НЕ ставим: предложка не под Screen-баром (иначе бар прыгает на правке).
  return (
    <FoodEntryCard
      id={uid}
      className={styles.group}
      style={paletteStyle}
      quantity={item.quantity}
      unit="г"
      onCommitQuantity={(quantity) => onCommitQuantity(uid, quantity)}
      name={nameContent}
      nameClassName={clsx(showOriginalFallback && styles.nameOriginal)}
      nameHtmlFor={searchInputId}
      onNamePointerDown={handleNamePointerDown}
      details={item.details || undefined}
      belowName={belowName}
      time={item.time || '00:00'}
      onCommitTime={(time) => onCommitTime(uid, time)}
      hideTime={hideTime}
    />
  );
};

export default ProposalFoodItem;

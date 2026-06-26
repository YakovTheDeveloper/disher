import { type CSSProperties } from 'react';
import clsx from 'clsx';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Text } from '@/shared/ui/atoms/Typography';
import { Card } from '@/shared/ui/atoms/Card';
import { TitleCluster } from '@/shared/ui/atoms/TitleCluster';
import { EditableQuantity } from '@/shared/ui/atoms/EditableQuantity';
import { CardTime } from '@/shared/ui/atoms/CardTime';
import { formatClock } from '@/shared/lib/time/formatClock';
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

  // Инлайн-правка количества — вынесена в EditableQuantity (был копипаст 1:1 с
  // ScheduleFoodItemInline). dataEntityEdit НЕ ставим: предложка не под Screen-
  // баром, иначе бар начнёт прыгать на правке (см. critique Slice 2).
  const qtyStack = (
    <EditableQuantity
      value={item.quantity}
      unit="г"
      onCommit={(quantity) => onCommitQuantity(uid, quantity)}
    />
  );

  // Маппинг на compound Card (food-модель, card-chassis-simplify план): Time из
  // левого желоба → в карточку (низ-право); qty ПЕРЕД именем (title-кластер);
  // детали → Meta caption (sans, было serif QuietLabel — решение B). Card.Root
  // (= LongPressRow + 2-рядная геометрия) владеет фоном/long-press/recent/tod и
  // гасит --row-pad-inline:0, инсет владеет внутренний `.card` (16px) —
  // выравнивает с ScheduleFoodItemInline. Статус-палитра (paletteStyle) и rescue/
  // delete (в InlineWriteFoodReview, СНАРУЖИ) — сохранены.
  return (
    <Card.Root id={uid} className={styles.group} style={paletteStyle}>
      {/* Title = [qty][имя] кластер (qty ПЕРЕД именем) — много-голосый узел → node.
          Имя = FoodName(label htmlFor searchInputId): тап → правка через InlineWrite-
          FoodReview focus-capture (onPointerDown стэшит uid ДО фокуса). «оригинал» —
          тихой строкой под именем (nameWrap-колонка). */}
      <Card.Title>
        <TitleCluster>
          {qtyStack}
          <span className={styles.nameWrap} onPointerDown={handleNamePointerDown}>
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
          </span>
        </TitleCluster>
      </Card.Title>

      {/* Meta = детали (Card строит sans-caption + клэмп-2 — решение B; было QuietLabel). */}
      {item.details && <Card.Meta>{item.details}</Card.Meta>}

      {/* Time = CardTime (из левого желоба В карточку, право-низ). */}
      {!hideTime && (
        <Card.Time>
          <CardTime
            value={item.time || '00:00'}
            onCommit={(time) => onCommitTime(uid, time)}
            formatDisplay={formatClock}
          />
        </Card.Time>
      )}
    </Card.Root>
  );
};

export default ProposalFoodItem;

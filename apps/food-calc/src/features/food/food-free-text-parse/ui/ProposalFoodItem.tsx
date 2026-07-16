import { type CSSProperties } from 'react';
import clsx from 'clsx';
import { FoodEntryCard } from '@/shared/ui/atoms/FoodEntryCard';
import styles from './ProposalFoodItem.module.scss';

/** id инпутов шагов флоу правки (useFoodEntryFlow, target 'proposal'). */
export interface ProposalEditInputIds {
  SEARCH_INPUT: string;
  QUANTITY_INPUT: string;
  TIME_INPUT: string;
  CHOOSE_INPUT: string;
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
  /** Нераспознанный ряд без выбранной еды → имя-fallback = сам оригинал (italic). */
  isUnresolved?: boolean;
  hideTime?: boolean;
  inputIds: ProposalEditInputIds;
  /** CSSProperties (`--tod-*` / `--accent-stripe`) → LongPressRow surface. */
  paletteStyle?: CSSProperties;
}

export const ProposalFoodItem = ({
  uid,
  item,
  isUnresolved,
  hideTime,
  inputIds,
  paletteStyle,
}: ProposalFoodItemProps) => {
  const showOriginalFallback = isUnresolved && !item.productId;

  // ScheduleFoodItemInline-style: pointerdown ТОЛЬКО stash'ит uid в dataset
  // input'а нужного шага. Родитель (InlineWriteFoodReview) читает его при focus
  // event и праймит флоу. КРИТИЧНО: state update НЕ здесь, иначе ModalByLabel
  // expand'ится между pointerdown и pointerup, и native click приземляется по
  // координатам на кнопку «назад» уже раскрытой модалки → она тут же закрывается.
  // Stash → focus → prime: модалка expand'ится ПОСЛЕ того, как click отработал
  // на label-делегированный input.
  const stashUid = (inputId: string) => () => {
    const trigger = document.getElementById(inputId);
    if (trigger) trigger.dataset.activeItemUid = uid;
  };

  // FoodName ожидает content={name} | null — оборачиваем строку.
  const nameContent = { name: showOriginalFallback ? item.originalName : item.name };

  // Тап по имени: у ряда с уже подобранной едой → хаб-чузер CHOOSE_INPUT
  // («Поменять еду» / «Поменять особенности»). У ещё-нераспознанного (pending, еды
  // нет) менять особенности не у чего — тап ведёт СРАЗУ в поиск (кейс «выбрать из
  // списка», без лишнего шага-развилки).
  const nameTargetInput = showOriginalFallback ? inputIds.SEARCH_INPUT : inputIds.CHOOSE_INPUT;

  // Тонкий контейнер: мапим item предложки в общий FoodEntryCard. Все три ячейки
  // (имя / количество / время) — label-триггеры ОДНОГО флоу правки еды; инлайн-полей
  // в ряду больше нет. Статус-палитра (paletteStyle) и rescue/delete (в
  // InlineWriteFoodReview, СНАРУЖИ) — как были.
  return (
    <FoodEntryCard
      id={uid}
      className={styles.group}
      style={paletteStyle}
      quantity={item.quantity}
      unit="г"
      qtyHtmlFor={inputIds.QUANTITY_INPUT}
      onQtyPointerDown={stashUid(inputIds.QUANTITY_INPUT)}
      name={nameContent}
      nameClassName={clsx(showOriginalFallback && styles.nameOriginal)}
      nameHtmlFor={nameTargetInput}
      onNamePointerDown={stashUid(nameTargetInput)}
      details={item.details || undefined}
      time={item.time || '00:00'}
      timeHtmlFor={inputIds.TIME_INPUT}
      onTimePointerDown={stashUid(inputIds.TIME_INPUT)}
      hideTime={hideTime}
    />
  );
};

export default ProposalFoodItem;

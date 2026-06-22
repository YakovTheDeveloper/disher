import { type ReactNode } from 'react';
import clsx from 'clsx';
import { WriteFoodInput } from '@/features/food/food-free-text-parse';
import type { UseWriteFoodFlowResult } from '@/features/food/food-free-text-parse';
import s from './AppBottomBar.module.scss';

type Props = {
  writeFoodFlow: UseWriteFoodFlowResult;
  writeFoodInputId: string;
  /** Placeholder самого инпута. */
  writeFoodPlaceholder?: string;
  /** htmlFor для search-affordance (лупа). Каждый consumer указывает свой MODAL_INPUT_IDS.SEARCH_INPUT. */
  searchHtmlFor: string;
  searchLabel?: string;
  /** Подпись под лупой (например, "Каталог"). */
  searchText?: string;
  /** Опциональная подсказка-пример над баром в фокусе (см. WriteFoodInput.hint). */
  writeFoodHint?: string;
  /**
   * Контент перед write-field. Сейчас не используется (сводка нутриентов
   * переехала в полосу NutrientsBar в конце списка и на HomePage, и на DishPage
   * — 2026-06-19); слот оставлен как общая точка расширения дока.
   */
  leadingSlot?: ReactNode;
};

/**
 * Bottom dock для HomePage (FoodSchedule) и DishBuilderPage: writes-pill
 * (`WriteFoodInput` — AutoGrowSearch + send + лупа) + опциональный leading
 * слот слева. 2026-05-23: writeFoodInputLike флаг удалён, inline-input теперь
 * единственный режим.
 */
export const AppBottomBar = ({
  writeFoodFlow,
  writeFoodInputId,
  writeFoodPlaceholder,
  searchHtmlFor,
  searchLabel,
  searchText,
  writeFoodHint,
  leadingSlot,
}: Props) => {
  return (
    <div className={clsx(s.dock, s.dockV2, s.writeDock)}>
      {leadingSlot}
      <WriteFoodInput
        flow={writeFoodFlow}
        inputId={writeFoodInputId}
        placeholder={writeFoodPlaceholder}
        searchHtmlFor={searchHtmlFor}
        searchLabel={searchLabel}
        searchText={searchText}
        hint={writeFoodHint}
        className={s.writeBarSlot}
      />
    </div>
  );
};

export default AppBottomBar;

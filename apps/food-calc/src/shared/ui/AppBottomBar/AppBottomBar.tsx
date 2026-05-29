import { type ReactNode } from 'react';
import clsx from 'clsx';
import { WriteFoodInput } from '@/features/food/food-free-text-parse';
import type { UseWriteFoodFlowResult } from '@/features/food/food-free-text-parse';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useNow } from '@/shared/lib/time/useNow';
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
  /**
   * Контент перед write-field (например `<NutrientsSummaryButton/>`).
   * На HomePage сейчас не используется (nutrient-pill переехал в HomeTopBar),
   * на DishPage пока живёт здесь — детальные страницы заняты centerLabel'ом
   * имени блюда/продукта, и centerSlot в HomeTopBar не свободен.
   */
  leadingSlot?: ReactNode;
};

/**
 * Bottom dock для HomePage (FoodSchedule) и DishBuilderPage: writes-pill
 * (`WriteFoodInput` — AutoGrowSearch + send + лупа) + опциональный leading
 * слот слева. tod-tokens (`--cta-*`, `--bar-tint`) живут на `.dockV2[data-tod]`
 * — их читают `dark-pill-button()` consumers (RunAnalysisButton, AddButton.dark)
 * И `AppBottomBarShell` (Laboratory/ScheduleEvents). 2026-05-23: writeFoodInputLike
 * флаг удалён, inline-input теперь единственный режим.
 */
export const AppBottomBar = ({
  writeFoodFlow,
  writeFoodInputId,
  writeFoodPlaceholder,
  searchHtmlFor,
  searchLabel,
  searchText,
  leadingSlot,
}: Props) => {
  const tod = getTimeOfDay(useNow());

  return (
    <div className={clsx(s.dock, s.dockV2, s.writeDock)} data-tod={tod}>
      {leadingSlot}
      <WriteFoodInput
        flow={writeFoodFlow}
        inputId={writeFoodInputId}
        placeholder={writeFoodPlaceholder}
        searchHtmlFor={searchHtmlFor}
        searchLabel={searchLabel}
        searchText={searchText}
        className={s.writeBarSlot}
      />
    </div>
  );
};

export default AppBottomBar;

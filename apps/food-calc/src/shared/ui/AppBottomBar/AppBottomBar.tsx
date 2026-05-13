import type { ReactNode } from 'react';
import clsx from 'clsx';
import { WriteFoodButton } from '@/features/food/food-free-text-parse';
import type { UseWriteFoodFlowResult } from '@/features/food/food-free-text-parse';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useNow } from '@/shared/lib/time/useNow';
import s from './AppBottomBar.module.scss';

const SearchIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.6" />
    <path d="M20 20l-4.2-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

type Props = {
  writeFoodFlow: UseWriteFoodFlowResult;
  writeFoodInputId: string;
  writeFoodLabel?: string;
  /** htmlFor of the search input. Each consumer points at its own MODAL_INPUT_IDS.SEARCH_INPUT. */
  searchHtmlFor: string;
  searchLabel?: string;
  /**
   * Content for the leading 40px slot (left of the CTA pill). When omitted —
   * a 40px placeholder keeps the row centered. Consumers compose their own
   * node (e.g. <NutrientsSummaryButton/>) and gate visibility themselves.
   */
  leadingSlot?: ReactNode;
  hidden?: boolean;
};

export const AppBottomBar = ({
  writeFoodFlow,
  writeFoodInputId,
  writeFoodLabel = 'Опишите, что ели…',
  searchHtmlFor,
  searchLabel,
  leadingSlot,
  hidden,
}: Props) => {
  const tod = getTimeOfDay(useNow());

  return (
    <div className={clsx(s.dock, s.dockV2, hidden && s.hidden)} data-tod={tod}>
      {leadingSlot ?? <span className={s.iconButton} aria-hidden />}

      <WriteFoodButton
        flow={writeFoodFlow}
        inputId={writeFoodInputId}
        label={writeFoodLabel}
        className={s.dockPrimary}
        dark
      />

      <label
        htmlFor={searchHtmlFor}
        className={s.iconButton}
        aria-label={searchLabel ?? 'Найти'}
      >
        <SearchIcon />
      </label>
    </div>
  );
};

export default AppBottomBar;

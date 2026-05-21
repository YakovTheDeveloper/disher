import type { ReactNode } from 'react';
import clsx from 'clsx';
import { WriteFoodButton } from '@/features/food/food-free-text-parse';
import type { UseWriteFoodFlowResult } from '@/features/food/food-free-text-parse';
import { getTimeOfDay } from '@/shared/lib/time-of-day';
import { useNow } from '@/shared/lib/time/useNow';
import s from './AppBottomBar.module.scss';

const SearchIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10.3" cy="10.3" r="9.6" stroke="currentColor" strokeWidth="1.1" />
    <path d="M21.5 21.5 L17.1 17.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    {/* checkmark inside the lupa — smaller, more air to circle edge */}
    <path
      d="M7 10.8 L10 13.5 L14 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

type Props = {
  writeFoodFlow: UseWriteFoodFlowResult;
  writeFoodInputId: string;
  writeFoodLabel?: string;
  /**
   * Repaint the CTA pill as sky (solid #c7dbf3 + deep-ink). Default `false` →
   * dark purple-navy pill (HomePage canon, time-of-day-tinted). Opt-in for
   * DishBuilderPage where the page is unified around the sky palette.
   */
  writeFoodSky?: boolean;
  /** htmlFor of the search input. Each consumer points at its own MODAL_INPUT_IDS.SEARCH_INPUT. */
  searchHtmlFor: string;
  searchLabel?: string;
  /**
   * Visible 2-line caption next to the lupa icon (e.g. "список\nеды"). When
   * omitted, the trailing slot stays icon-only.
   */
  searchText?: string;
  /**
   * Content for the leading 40px slot (left of the CTA pill). When omitted —
   * a 40px placeholder keeps the row centered. Consumers compose their own
   * node (e.g. <NutrientsSummaryButton/>) and gate visibility themselves.
   */
  leadingSlot?: ReactNode;
};

export const AppBottomBar = ({
  writeFoodFlow,
  writeFoodInputId,
  writeFoodLabel = 'Опишите, что ели…',
  writeFoodSky = false,
  searchHtmlFor,
  searchLabel,
  searchText,
  leadingSlot,
}: Props) => {
  const tod = getTimeOfDay(useNow());

  return (
    <div className={clsx(s.dock, s.dockV2)} data-tod={tod}>
      {leadingSlot ?? <span className={s.iconButton} aria-hidden />}

      <WriteFoodButton
        flow={writeFoodFlow}
        inputId={writeFoodInputId}
        label={writeFoodLabel}
        className={s.dockPrimary}
        dark={!writeFoodSky}
        sky={writeFoodSky}
      />

      <label
        htmlFor={searchHtmlFor}
        className={clsx(s.iconButton, searchText && s.searchWithText)}
        aria-label={searchLabel ?? 'Найти'}
      >
        <SearchIcon />
        {searchText && <span className={s.searchTextLabel}>{searchText}</span>}
      </label>
    </div>
  );
};

export default AppBottomBar;

import clsx from 'clsx';
import { WriteFoodButton } from '@/features/food/food-free-text-parse';
import type { UseWriteFoodFlowResult } from '@/features/food/food-free-text-parse';
import { SCHEDULE_FOOD_INPUT_IDS } from './useScheduleFoodFlow';
import s from './HomeBottomBar.module.scss';

const SearchIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.6" />
    <path d="M20 20l-4.2-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const PlusIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const MoreIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="18" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

const MicIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Compound "T/M" icon used in V5 «Описать» — signals оба входа:
// печатать (Т, как в WriteFoodButton) и голос (микрофон).
const TypeMicIcon = () => (
  <span className={s.tmIcon} aria-hidden>
    <svg width="12" height="14" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 2h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M1 2v1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13 2v1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 2.2v11.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.4 14h5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <span className={s.tmSlash}>/</span>
    <MicIcon size={14} />
  </span>
);

type Variant = 'floating' | 'dock' | 'omnibox' | 'composer' | 'segmented';

const VARIANTS: readonly Variant[] = ['floating', 'dock', 'omnibox', 'composer', 'segmented'];

export const HOME_BOTTOM_BAR_VARIANTS = VARIANTS;

type Props = {
  variantIndex: number;
  writeFoodFlow: UseWriteFoodFlowResult;
  writeFoodInputId: string;
  onPlusClick: () => void;
  hidden?: boolean;
};

export const HomeBottomBar = ({
  variantIndex,
  writeFoodFlow,
  writeFoodInputId,
  onPlusClick,
  hidden,
}: Props) => {
  const variant = VARIANTS[variantIndex] ?? VARIANTS[0];

  if (variant === 'floating') return null;

  if (variant === 'dock') {
    // V2 — Solid dock + central primary
    // 3 elements: [+] ghost · [Описать] filled accent · [Q] ghost
    return (
      <div className={clsx(s.dock, s.dockV2, hidden && s.hidden)}>
        <button
          type="button"
          className={s.iconButton}
          onClick={onPlusClick}
          aria-label="Создать продукт или блюдо"
        >
          <PlusIcon />
        </button>

        <WriteFoodButton
          flow={writeFoodFlow}
          inputId={writeFoodInputId}
          label="Опишите, что ели…"
          className={s.dockPrimary}
          dark
        />

        <label
          htmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT}
          className={s.iconButton}
          aria-label="Найти еду"
        >
          <SearchIcon />
        </label>
      </div>
    );
  }

  if (variant === 'omnibox') {
    // V3 — Omnibox: single input pill spanning the bar
    // Tap = open write modal (primary intent). Trailing [⋯] opens create menu.
    // Leading [Q] still routes to search modal for explicit search intent.
    return (
      <div className={clsx(s.dock, s.dockV3, hidden && s.hidden)}>
        <label
          htmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT}
          className={s.leadingIcon}
          aria-label="Найти еду"
        >
          <SearchIcon />
        </label>

        <WriteFoodButton
          flow={writeFoodFlow}
          inputId={writeFoodInputId}
          label="Найти или описать что ели…"
          className={s.omniboxField}
        />

        <button
          type="button"
          className={s.iconButton}
          onClick={onPlusClick}
          aria-label="Создать"
        >
          <MoreIcon />
        </button>
      </div>
    );
  }

  if (variant === 'composer') {
    // V4 — Composer (chat-style)
    // Wide write-pill with mic trailing inside, send-style accent on right.
    return (
      <div className={clsx(s.dock, s.dockV4, hidden && s.hidden)}>
        <label
          htmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT}
          className={s.leadingIcon}
          aria-label="Найти еду"
        >
          <SearchIcon />
        </label>

        <div className={s.composerWrap}>
          <WriteFoodButton
            flow={writeFoodFlow}
            inputId={writeFoodInputId}
            label="Что ел? Например, овсянка 200г"
            className={s.composerField}
          />
          <span className={s.composerMic} aria-hidden>
            <MicIcon />
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'segmented') {
    // V5 — Segmented bar: three equal-weight actions (no single accent).
    // «Найти» и «Описать» — двустрочные с иконкой в верхней строке.
    return (
      <div className={clsx(s.dock, s.dockV5, hidden && s.hidden)}>
        <label
          htmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT}
          className={clsx(s.segItem, s.segItemStacked)}
        >
          <span className={s.segPrimary}>
            <SearchIcon size={14} />
            <span>Найти еду</span>
          </span>
          <span className={s.segSecondary}>вручную</span>
        </label>

        <div className={s.segDivider} aria-hidden />

        <WriteFoodButton
          flow={writeFoodFlow}
          inputId={writeFoodInputId}
          label="Описать"
          subLabel="прием пищи"
          icon={<TypeMicIcon />}
          className={clsx(s.segItem, s.segItemWrite)}
        />

        <div className={s.segDivider} aria-hidden />

        <button type="button" className={s.segItem} onClick={onPlusClick}>
          <PlusIcon size={16} />
          <span>Создать</span>
        </button>
      </div>
    );
  }

  return null;
};

export default HomeBottomBar;

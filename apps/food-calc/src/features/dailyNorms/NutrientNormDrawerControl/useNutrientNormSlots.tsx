import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useHasUserNorm, upsertUserNorm } from '@/entities/daily-norm';
import { USER_NORM_ID } from '@/entities/daily-norm/model/default-norm';
import { db } from '@/shared/lib/dexie/schema';
import CreateDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal';
import EditDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal';
import s from './NutrientNormDrawerControl.module.scss';

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 18l-6-6 6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Mode = 'view' | 'edit' | 'create';

export type NutrientNormSlots = {
  hasNorm: boolean;
  /** Drawer header title for the current mode. */
  title: string;
  /** Gear button in view mode (only if hasNorm), back button in edit/create. */
  headerAction: ReactNode;
  /** When non-null, render this INSTEAD OF the nutrients-view body. */
  bodyContent: ReactNode | null;
  /** Render at the top of drawer body when in view mode and no norm set. */
  emptyStateBanner: ReactNode;
  /** Dev-only toggle (auto-gated by import.meta.env.DEV, view mode only). */
  devToggle: ReactNode;
};

/**
 * Two-state nutrients drawer: 'view' (nutrients list) ↔ 'edit'/'create' (norm form).
 *
 * Consumer wiring:
 *   const slots = useNutrientNormSlots({ isOpen: nutrientsOpen });
 *   <SideDrawer title={slots.title} headerAction={slots.headerAction}>
 *     {slots.bodyContent ?? (
 *       <>{slots.devToggle}{slots.emptyStateBanner}<FoodsNutrients .../></>
 *     )}
 *   </SideDrawer>
 *
 * `isOpen` is used to reset the mode back to 'view' when the drawer closes,
 * so reopening always starts from the nutrients list rather than mid-form.
 */
export function useNutrientNormSlots(
  opts: { isOpen?: boolean } = {},
): NutrientNormSlots {
  const { isOpen = true } = opts;
  const hasNorm = useHasUserNorm();
  const [mode, setMode] = useState<Mode>('view');

  // Reset to view on drawer NEXT open (open=false → open=true transition).
  // Resetting on close would unmount the form mid-slide-out, causing the
  // nutrients view to flash through during the ~250ms close animation.
  // By resetting on open, the form stays put while sliding away and the
  // next open expands into a fresh nutrients view.
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    if (!wasOpenRef.current && isOpen) setMode('view');
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const goToView = useCallback(() => setMode('view'), []);
  const goToEdit = useCallback(() => setMode('edit'), []);
  const goToCreate = useCallback(() => setMode('create'), []);

  const toggleNormDev = useCallback(async () => {
    if (hasNorm) {
      await db.daily_norms.delete(USER_NORM_ID);
    } else {
      await upsertUserNorm({});
    }
  }, [hasNorm]);

  const title =
    mode === 'view' ? 'Нутриенты' : mode === 'edit' ? 'Моя норма' : 'Подобрать норму';

  const headerAction: ReactNode =
    mode !== 'view' ? (
      <button
        type="button"
        className={s.backBtn}
        onClick={goToView}
        aria-label="Назад к нутриентам"
      >
        <BackIcon />
      </button>
    ) : hasNorm ? (
      <button
        type="button"
        className={s.gearBtn}
        onClick={goToEdit}
        aria-label="Перенастроить дневную норму"
      >
        <GearIcon />
      </button>
    ) : null;

  const bodyContent: ReactNode | null =
    mode === 'edit' ? (
      <EditDailyNormModal chrome="panel" onClose={goToView} onRecalc={goToCreate} />
    ) : mode === 'create' ? (
      <CreateDailyNormModal chrome="panel" onClose={goToView} />
    ) : null;

  const emptyStateBanner =
    !hasNorm && mode === 'view' ? (
      <button type="button" className={s.emptyBanner} onClick={goToCreate}>
        <span className={s.emptyBannerText}>
          Подбери дневную норму, чтобы проценты стали твоими
        </span>
        <span className={s.emptyBannerArrow}>→</span>
      </button>
    ) : null;

  const devToggle =
    import.meta.env.DEV && mode === 'view' ? (
      <button
        type="button"
        className={s.devToggle}
        onClick={() => void toggleNormDev()}
      >
        dev · hasNorm: {hasNorm ? 'on' : 'off'} — toggle
      </button>
    ) : null;

  return { hasNorm, title, headerAction, bodyContent, emptyStateBanner, devToggle };
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useHasUserNorm, upsertUserNorm } from '@/entities/daily-norm';
import CreateDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal';
import EditDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal';
import FlagIcon from '@/shared/assets/icons/flag.svg?react';
import s from './NutrientNormDrawerControl.module.scss';

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
 * Sole consumer is `widgets/nutrients/NutrientsDrawer`, opened on the store
 * path via `drawerStore.show(NutrientsDrawer, props, { side: 'left' })`. Each
 * `show()` is a fresh mount, so `mode` naturally starts at 'view' — call this
 * with no args.
 *
 * `isOpen` (default `true`) is a legacy escape hatch: it resets the mode back
 * to 'view' on a false→true transition, for a consumer that keeps this hook
 * mounted across opens instead of remounting. The store path never needs it.
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
    // The norm is a singleton — never deleted (so never tombstoned). The dev
    // toggle flips between empty items (= "no norm set") and a sample norm.
    // '1' is a real catalog nutrient id (the scheme is custom numeric strings,
    // not FDC) so the preview renders a recognised target, not a phantom.
    await upsertUserNorm(hasNorm ? {} : { '1': 100 });
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
        className={s.flagBtn}
        onClick={goToEdit}
        aria-label="Перенастроить дневную норму"
      >
        <FlagIcon width={18} height={18} />
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

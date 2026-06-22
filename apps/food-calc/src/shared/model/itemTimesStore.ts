import { create } from 'zustand';

/**
 * Display preference: hide the per-item time inside schedule rows
 * (FoodSchedule + ScheduleEvents). Shared by both the Food and Event screens.
 *
 * Default is **always shown** (`hidden: false`) and NOT persisted: the time-group
 * header — the only toggle entry point — is hidden by default now (TimeHeader
 * `hidden` variant), and the per-row time lives in the left gutter (baked
 * messenger-style placement). So per-row time must reliably appear out of the box; we no
 * longer read a saved "hidden" flag on load. The toggle still works in-session
 * for anyone on a visible header variant — it just doesn't survive a reload.
 *
 * A one-time cleanup drops the legacy `disher.hideItemTimes` key so devices that
 * had it persisted to "1" aren't stuck with times hidden.
 */

const LEGACY_STORAGE_KEY = 'disher.hideItemTimes';

try {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
} catch {
  /* ignore quota / private mode */
}

type ItemTimesStore = {
  /** When true, per-item time labels in schedule rows are hidden. */
  hidden: boolean;
  toggle: () => void;
};

export const useItemTimesStore = create<ItemTimesStore>((set, get) => ({
  hidden: false,
  toggle: () => set({ hidden: !get().hidden }),
}));

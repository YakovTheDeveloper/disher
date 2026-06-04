import { create } from 'zustand';

/**
 * Display preference: hide the per-item time inside schedule rows
 * (FoodSchedule + ScheduleEvents). Items are clustered into TimeGroups whose
 * header already shows the time range, so the per-row time is redundant noise
 * once you're scanning a day. Clicking the group time (TimeGroup `message_time`)
 * toggles this flag; it's a global, persisted UI preference shared by both the
 * Food and Event screens.
 *
 * Persisted in localStorage (synchronous read on init → no flash on load),
 * matching the `designVariantsStore` convention. Not user data — survives
 * sign-out (idb-keyval wipe doesn't touch this).
 */

const STORAGE_KEY = 'disher.hideItemTimes';

function loadHidden(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistHidden(hidden: boolean): void {
  try {
    if (hidden) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

type ItemTimesStore = {
  /** When true, per-item time labels in schedule rows are hidden. */
  hidden: boolean;
  toggle: () => void;
};

export const useItemTimesStore = create<ItemTimesStore>((set, get) => ({
  hidden: loadHidden(),
  toggle: () => {
    const hidden = !get().hidden;
    persistHidden(hidden);
    set({ hidden });
  },
}));

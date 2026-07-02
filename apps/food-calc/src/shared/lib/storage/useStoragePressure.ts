import { create } from 'zustand';
import { setQuotaExceededHandler } from '@/shared/lib/dexie/dexieError';

// Storage-pressure watcher. IndexedDB silently starts refusing writes as the
// origin nears its quota, so a full disk is a tier-3 silent-failure risk. This
// slim always-on probe reads `navigator.storage.estimate()` at boot and again
// right after a QuotaExceededError, and flips a persistent banner (see
// StoragePressureBanner) once usage crosses 90% — early enough that the user can
// export/free space BEFORE writes start dropping.

const PRESSURE_RATIO = 0.9;

type StoragePressureState = {
  /** True once usage/quota crosses PRESSURE_RATIO. */
  underPressure: boolean;
  /** Last estimate (bytes), or null before the first probe. */
  usage: number | null;
  quota: number | null;
  set: (partial: Partial<StoragePressureState>) => void;
};

export const useStoragePressureStore = create<StoragePressureState>((set) => ({
  underPressure: false,
  usage: null,
  quota: null,
  set: (partial) => set(partial),
}));

/** Read the current estimate and update the store. Safe to call anywhere — it
 *  never throws and no-ops where the Storage API is missing. */
export async function refreshStoragePressure(): Promise<void> {
  const estimate = navigator.storage?.estimate;
  if (!estimate) return;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    if (typeof usage !== 'number' || typeof quota !== 'number' || quota <= 0) return;
    useStoragePressureStore.getState().set({
      usage,
      quota,
      underPressure: usage / quota > PRESSURE_RATIO,
    });
  } catch {
    // best-effort: estimate is diagnostics; a failed read never loses user data
    // and must not itself surface an error.
  }
}

/** Wire the write-contract's quota hook to a re-probe and run the boot probe.
 *  Idempotent — call once at app boot. */
let installed = false;
export function installStoragePressureWatcher(): void {
  if (installed) return;
  installed = true;
  setQuotaExceededHandler(() => void refreshStoragePressure());
  void refreshStoragePressure();
}

/** Subscribe to the under-pressure flag. */
export function useStoragePressure(): boolean {
  return useStoragePressureStore((s) => s.underPressure);
}

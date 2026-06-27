import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Per-device consent to cloud sync. Mirrors user-theme-store exactly (Zustand
// persist + localStorage + migrate guard + version). The flag gates the single
// sync egress chokepoint syncNow() (see shared/lib/snapshot/index.ts).
//
// DEFAULT IS ON: sync stays enabled by default, so existing users' behaviour is
// unchanged (no migration, no data-loss). The destructive/private moment is
// turning it OFF, which erases the server vault — handled by SyncDisableDrawer.
//
// Consent is NEVER stored on the server (that would be circular) and is NOT
// synced. It is per-device and resets to the default (ON) on sign-out so a
// shared device doesn't leak user A's switch position to user B (auth-store).

const DEFAULT_SYNC_ENABLED = true;

interface SyncPrefStore {
  syncEnabled: boolean;
  setSyncEnabled: (syncEnabled: boolean) => void;
}

export const useSyncPrefStore = create<SyncPrefStore>()(
  persist(
    (set) => ({
      syncEnabled: DEFAULT_SYNC_ENABLED,
      setSyncEnabled: (syncEnabled) => set({ syncEnabled }),
    }),
    {
      name: 'disher.sync-enabled',
      storage: createJSONStorage(() => localStorage),
      // Defensive: localStorage may hold a malformed value. Reject anything that
      // isn't a boolean and fall back to the default (ON).
      migrate: (persisted) => {
        if (
          persisted &&
          typeof persisted === 'object' &&
          'syncEnabled' in persisted &&
          typeof (persisted as { syncEnabled: unknown }).syncEnabled === 'boolean'
        ) {
          return persisted as SyncPrefStore;
        }
        return { syncEnabled: DEFAULT_SYNC_ENABLED } as SyncPrefStore;
      },
      version: 1,
    },
  ),
);

// Non-reactive getter for the egress chokepoint (syncNow) — it must read the
// live value without subscribing to React.
export const isSyncEnabled = () => useSyncPrefStore.getState().syncEnabled;

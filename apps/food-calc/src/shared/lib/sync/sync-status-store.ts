import { create } from 'zustand';
import type { ErrorKind } from '@/shared/lib/errors/classify';
import { reportError } from '@/shared/lib/errors/report';

// Status of the snapshot sync (pull → merge → push). Background sync used to
// fail SILENTLY — the user believed their data was in the cloud when the push
// had actually dropped. This store makes the outcome observable so the
// SyncStatusBar and the failure toaster (see runSync.ts) can render it.
//
// It is deliberately NOT a scheduler: nothing here retries. Retry is user-driven
// (the SyncStatusBar refresh button, the manual Profile buttons). See [[backup-only-plan]].

export type SyncState = 'idle' | 'syncing' | 'synced' | 'failed';

type SyncStatusState = {
  state: SyncState;
  /** Classified error of the last failed sync (drives chip text/color). */
  lastError: ErrorKind | null;
  /** Support-correlation id of the last failure. */
  refId: string | null;
  /** Epoch ms of the last successful sync. */
  lastSyncedAt: number | null;
  begin: () => void;
  succeed: () => void;
  /** Report + record a failure. Returns the classified kind for the caller. */
  fail: (err: unknown) => ErrorKind;
};

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  state: 'idle',
  lastError: null,
  refId: null,
  lastSyncedAt: null,
  begin: () => set({ state: 'syncing' }),
  succeed: () =>
    set({ state: 'synced', lastError: null, refId: null, lastSyncedAt: Date.now() }),
  fail: (err) => {
    const { kind, refId } = reportError('sync', err);
    set({ state: 'failed', lastError: kind, refId });
    return kind;
  },
}));

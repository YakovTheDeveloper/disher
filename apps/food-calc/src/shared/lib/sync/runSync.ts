import toaster from '@/shared/lib/toaster/toaster';
import { syncNow } from '@/shared/lib/snapshot';
import { handleSessionExpired } from '@/features/auth/handleSessionExpired';
import { useSyncStatusStore } from './sync-status-store';

// Call-site wrapper around syncNow(). We deliberately DON'T touch syncNow's
// signature — it is the privacy chokepoint (consent gate) and stays clean.
// runSyncTracked owns the *observability*: it drives the sync-status store so a
// dropped push is recorded and surfaced by the SyncStatusChip (in Settings).
// The loud «не удалось сохранить» failure toaster was removed for now (per
// request) — a failed sync no longer interrupts with a toast. Offline is not
// treated as a failure to shout about.

interface RunSyncOptions {
  /**
   * When offline + user-initiated, show a quiet "работаем офлайн" note. Off for
   * the automatic BackupGate mount sync so we don't nag on every cold start with
   * no network. A genuine *online* failure always toasts regardless of this flag.
   */
  surfaceToast?: boolean;
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

/**
 * Run a sync, tracking its outcome in the sync-status store. Never throws — the
 * caller gets a boolean (`true` = synced). On failure the store records the
 * classified error + refId (read by the SyncStatusChip in Settings). No failure
 * toaster is shown — only the offline, user-initiated ambient note survives.
 */
export async function runSyncTracked(opts: RunSyncOptions = {}): Promise<boolean> {
  const { begin, succeed, fail } = useSyncStatusStore.getState();
  begin();
  try {
    await syncNow();
    succeed();
    return true;
  } catch (err) {
    fail(err);
    // A mid-session 401 means the bearer expired — sign out (once) instead of
    // silently swallowing an error the user can't act on while unauthed.
    if (handleSessionExpired(err)) return false;
    // Online failure no longer toasts (removed per request) — it's recorded in
    // the sync-status store and surfaced by the SyncStatusChip in Settings.
    if (!isOnline() && opts.surfaceToast) {
      // Offline + user-initiated: quiet ambient note, not an error. Don't cry
      // wolf over a missing network; the automatic mount sync stays silent.
      toaster.notify('Работаем офлайн, синхронизируем позже');
    }
    return false;
  }
}

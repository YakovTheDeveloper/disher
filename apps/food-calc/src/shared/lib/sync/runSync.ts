import toaster from '@/shared/lib/toaster/toaster';
import { syncNow } from '@/shared/lib/snapshot';
import { handleSessionExpired } from '@/features/auth/handleSessionExpired';
import { useSyncStatusStore } from './sync-status-store';

// Call-site wrapper around syncNow(). We deliberately DON'T touch syncNow's
// signature — it is the privacy chokepoint (consent gate) and stays clean.
// runSyncTracked owns the *observability*: it drives the sync-status store and,
// on a genuine online failure, shows a retry-able toaster so a dropped push is
// never silent (dyra #1). Offline is not treated as a failure to shout about.

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
 * classified error + refId; when online, a toaster with «Повторить» is shown.
 */
export async function runSyncTracked(opts: RunSyncOptions = {}): Promise<boolean> {
  const { begin, succeed, fail } = useSyncStatusStore.getState();
  begin();
  try {
    await syncNow();
    succeed();
    return true;
  } catch (err) {
    const kind = fail(err);
    // A mid-session 401 means the bearer expired — sign out (once) instead of
    // showing a "не удалось сохранить" the user can't act on while unauthed.
    if (handleSessionExpired(err)) return false;
    if (isOnline()) {
      // Genuine failure while online: the push did NOT land — the user must know
      // their data isn't in the cloud, and be able to retry from anywhere (the
      // toaster is mounted globally, so it survives navigation off this screen).
      toaster.error('Не удалось сохранить в облако', {
        kind,
        action: {
          label: 'Повторить',
          onClick: () => void runSyncTracked({ surfaceToast: true }),
        },
      });
    } else if (opts.surfaceToast) {
      // Offline + user-initiated: quiet ambient note, not an error. Don't cry
      // wolf over a missing network; the automatic mount sync stays silent.
      toaster.notify('Работаем офлайн, синхронизируем позже');
    }
    return false;
  }
}

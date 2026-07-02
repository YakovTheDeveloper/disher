import { useSyncStatusStore } from '@/shared/lib/sync/sync-status-store';
import { runSyncTracked } from '@/shared/lib/sync/runSync';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useSyncPrefStore } from '@/shared/lib/sync-pref';
import Text from '@/shared/ui/atoms/Typography/Text/Text';
import styles from './SyncStatusChip.module.scss';

// Ambient sync-status chip. Renders NOTHING at rest (idle/synced, online) so it
// never adds clutter — it only appears when there's something worth saying:
//   • offline            → «Офлайн» (muted)
//   • syncing            → «Синхронизирую…» (muted)
//   • failed (online)    → «Не сохранено · Повторить» (danger, tap = retry)
// Signal is carried by BOTH colour AND text (WCAG 2.2 «color-not-only»). The
// failure toaster (runSync.ts) is the loud, must-see channel; this chip is the
// quiet persistent one for users who dismissed the toast.
export function SyncStatusChip() {
  const state = useSyncStatusStore((s) => s.state);
  const syncEnabled = useSyncPrefStore((s) => s.syncEnabled);
  const online = useOnline();

  // Sync turned off (consent withdrawn) — nothing to report; on-device only.
  if (!syncEnabled) return null;

  if (!online) {
    return (
      <span className={styles.chip} data-tone="muted" role="status">
        <Text as="span" role="label">Офлайн</Text>
      </span>
    );
  }

  if (state === 'syncing') {
    return (
      <span className={styles.chip} data-tone="muted" role="status">
        <Text as="span" role="label">Синхронизирую…</Text>
      </span>
    );
  }

  if (state === 'failed') {
    return (
      <button
        type="button"
        className={styles.chip}
        data-tone="danger"
        onClick={() => void runSyncTracked({ surfaceToast: true })}
      >
        <Text as="span" role="label">Не сохранено · Повторить</Text>
      </button>
    );
  }

  // idle / synced while online — say nothing.
  return null;
}

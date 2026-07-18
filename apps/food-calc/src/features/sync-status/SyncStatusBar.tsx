import { useSyncStatusStore } from '@/shared/lib/sync/sync-status-store';
import { runSyncTracked } from '@/shared/lib/sync/runSync';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { Text } from '@/shared/ui/atoms/Typography';
import { IconButton } from '@/shared/ui/atoms/Button';
import RefreshIcon from '@/shared/assets/icons/refresh.svg?react';
import styles from './SyncStatusBar.module.scss';

// Строгий штамп последней синхронизации — `dd.mm.yy, hh:mm`. Табличные цифры несёт
// сам .label (tnum), поэтому ширина строки не пляшет.
function formatSyncedAt(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yy = pad(d.getFullYear() % 100);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${yy}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Ряд статуса синхронизации в секции «Данные» дровера «Аккаунт»: без подложки,
// строгий Text «Последняя синхронизация dd.mm.yy, hh:mm» — штамп показываем ВСЕГДА
// (справа кнопка-иконка «обновить», тихая ink-плитка IconButton tone="soft").
// Провал последней синхры не подменяет штамп, а падает ОТДЕЛЬНОЙ строкой ниже —
// пользователь видит и когда синхронизировались, и что она не удалась. lastSyncedAt
// живёт в памяти (repopulated BackupGate-синхрой на маунте) — до первой синхры «—».
export function SyncStatusBar() {
  const state = useSyncStatusStore((s) => s.state);
  const lastSyncedAt = useSyncStatusStore((s) => s.lastSyncedAt);
  const online = useOnline();

  const syncing = state === 'syncing';
  const failed = online && state === 'failed';

  const stamp = lastSyncedAt != null ? formatSyncedAt(lastSyncedAt) : '—';

  return (
    <div className={styles.wrap} role="status">
      <div className={styles.bar}>
        <Text as="span" role="caption" className={styles.label}>
          Последняя синхронизация {stamp}
        </Text>
        <IconButton
          tone="soft"
          size={40}
          aria-label="Синхронизировать"
          onClick={() => void runSyncTracked({ surfaceToast: true })}
          disabled={syncing}
          icon={
            <RefreshIcon width={18} height={18} className={syncing ? styles.spin : undefined} />
          }
        />
      </div>
      {failed && (
        <Text as="span" role="caption" className={styles.error}>
          Не удалось сохранить
        </Text>
      )}
    </div>
  );
}

import { useSyncStatus } from '@/api/triplit/SyncProvider';
import styles from './SyncIndicator.module.scss';

const statusClass: Record<string, string> = {
  synced: styles.synced,
  syncing: styles.syncing,
  offline: styles.offline,
  idle: styles.idle,
};

export function SyncIndicator() {
  const status = useSyncStatus();
  return <div className={`${styles.indicator} ${statusClass[status] || styles.idle}`} />;
}

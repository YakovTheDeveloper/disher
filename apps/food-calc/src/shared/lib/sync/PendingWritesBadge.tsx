import { usePendingCount } from './usePendingCount';
import s from './PendingWritesBadge.module.scss';

export function PendingWritesBadge() {
  const count = usePendingCount();
  if (count === 0) return null;
  return (
    <div
      className={s.badge}
      role="status"
      aria-live="polite"
      aria-label={`${count} unsynced changes`}
      title="Несинхронизированных изменений"
    >
      <span className={s.dot} />
      <span className={s.count}>{count}</span>
    </div>
  );
}

export default PendingWritesBadge;

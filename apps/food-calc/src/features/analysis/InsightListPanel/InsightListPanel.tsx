import { memo } from 'react';
import { drawerStore } from '@/shared/ui';
import { ConfirmDrawer } from '@/shared/ui/ConfirmDrawer';
import { LongPressRow } from '@/features/shared/long-press-item';
import type { Insight } from '@/entities/insight';
import { ObservationCard } from '../ObservationCard';
import styles from './InsightListPanel.module.scss';

type Props = {
  /** Saved insights, newest-first (the page sorts by time). */
  insights: Insight[];
  onDelete: (id: string) => void;
};

// The saved-insights list on the Гипотезы/Инсайты page. Each row is an
// ObservationCard wrapped in a LongPressRow; insights are never authored by hand,
// so there is no write-bar here. Empty state is owned by the page.
//
// Deletion (Slice 3, 2026-06-26): the in-card delete chevron was removed — a
// saved insight is destroyed via a sustained press (or Shift+F10 / context-menu
// key) on the row, gated behind a ConfirmDrawer. Easy to stamp out by an
// accidental tap, no undo → the confirm is the guard. Swipe/cancel resolve
// non-`true` → no-op.
const InsightListPanel = ({ insights, onDelete }: Props) => {
  const confirmDelete = async (id: string) => {
    const ok = await drawerStore.show(ConfirmDrawer, {
      title: 'Удалить инсайт?',
      message: 'Инсайт исчезнет из списка наблюдений.',
      confirmLabel: 'Удалить',
      tone: 'danger',
    });
    if (ok) onDelete(id);
  };

  if (insights.length === 0) return null;

  return (
    <section className={styles.section}>
      <ul className={styles.list}>
        {insights.map((insight) => (
          <LongPressRow
            key={insight.id}
            id={insight.id}
            className={styles.row}
            onLongPress={() => confirmDelete(insight.id)}
          >
            <ObservationCard
              title={insight.title}
              detail={insight.detail}
              valence={insight.valence}
              strength={insight.strength}
              evidence={insight.evidence}
            />
          </LongPressRow>
        ))}
      </ul>
    </section>
  );
};

export default memo(InsightListPanel);

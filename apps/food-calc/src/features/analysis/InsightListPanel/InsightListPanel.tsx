import { memo } from 'react';
import { drawerStore } from '@/shared/ui';
import { ConfirmDrawer } from '@/shared/ui/ConfirmDrawer';
import type { Insight } from '@/entities/insight';
import { InsightCard } from '../InsightCard';
import styles from './InsightListPanel.module.scss';

type Props = {
  /** Saved insights, newest-first (the page sorts by time). */
  insights: Insight[];
  onDelete: (id: string) => void;
};

// The saved-insights list on the Гипотезы/Инсайты page. Each row is an
// InsightCard with a ✕ (delete) action; insights are never authored by hand, so
// there is no write-bar here. Empty state is owned by the page.
const InsightListPanel = ({ insights, onDelete }: Props) => {
  // Удаление гейтится подтверждением: инсайт легко стереть случайным тапом по
  // шеврону, а восстановления нет. Свайп/отмена резолвят не-`true` → no-op.
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
      <div className={styles.list}>
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            action="delete"
            onDelete={() => confirmDelete(insight.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default memo(InsightListPanel);

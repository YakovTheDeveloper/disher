import { memo } from 'react';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import type { Insight } from '@/entities/insight';
import { InsightCard } from '../InsightCard';
import styles from './InsightListPanel.module.scss';

// Valence-display variants (F3 «хз» → pick by eye in the DesignBar). The anchor
// lives HERE (one per surface), not on each card — so unmounting a single card
// (delete) can't unregister the shared entry and reset the others. Default 'sign'.
const INSIGHT_VALENCE_VARIANTS = ['sign', 'label', 'plain'] as const;

type Props = {
  /** Saved insights, newest-first (the page sorts by time). */
  insights: Insight[];
  onDelete: (id: string) => void;
};

// The saved-insights list on the Гипотезы/Инсайты page. Each row is an
// InsightCard with a ✕ (delete) action; insights are never authored by hand, so
// there is no write-bar here. Empty state is owned by the page.
const InsightListPanel = ({ insights, onDelete }: Props) => {
  const { anchor } = useDesignVariant('Insight', INSIGHT_VALENCE_VARIANTS);
  if (insights.length === 0) return null;

  return (
    <section className={styles.section} {...anchor}>
      <div className={styles.list}>
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            action="delete"
            onDelete={() => onDelete(insight.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default memo(InsightListPanel);

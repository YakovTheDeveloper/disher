import { memo } from 'react';
import { drawerStore } from '@/shared/ui';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { AnalysisKindDrawer } from '../AnalysisKindDrawer';
import styles from './AnalysisCtaButton.module.scss';

type Props = {
  date: string;
  /** Hypothesis ids ticked in the list — passed into the kind drawer. */
  selectedIds: string[];
};

// HomePage bottom-bar CTA. Renamed from RunDailyAnalysisButton: it no longer
// starts the daily review directly — it opens AnalysisKindDrawer (daily vs
// long). While a daily stream for this date is running it shows a spinner
// and is disabled; otherwise it is always active (the offline / empty-day
// gating lives on the «текущий день» option inside the drawer, so the path
// to the long analysis stays reachable even on an empty day).
const AnalysisCtaButton = ({ date, selectedIds }: Props) => {
  const streaming = useDailyAnalysisStore(
    (s) => s.byDate[date]?.status === 'streaming',
  );

  function handleClick() {
    if (streaming) return;
    void drawerStore.show(AnalysisKindDrawer, { date, hypothesisIds: selectedIds });
  }

  return (
    <button
      type="button"
      className={styles.cta}
      onClick={handleClick}
      disabled={streaming}
    >
      {streaming ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          Разбираем…
        </>
      ) : (
        <>
          <span className={styles.sparkle} aria-hidden="true">
            ✦
          </span>
          Разбор
        </>
      )}
    </button>
  );
};

export default memo(AnalysisCtaButton);

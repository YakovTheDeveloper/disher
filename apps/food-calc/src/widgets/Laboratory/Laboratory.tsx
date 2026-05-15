import { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { drawerStore } from '@/shared/ui';
import { useAllHypotheses } from '@/entities/hypothesis';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import {
  CreateHypothesisDrawer,
  openEditHypothesisDrawer,
} from '@/features/analysis/hypothesis-drawers';
import { RouterLinks } from '@/app/router';
import HypothesisListPanel from './HypothesisListPanel';
import DailyAnalysisSection from './DailyAnalysisSection';
import styles from './Laboratory.module.scss';

type Props = {
  date: string;
  topSlot?: React.ReactNode;
};

// HomePage slot 0 — the Laboratory. Hypothesis list (tick → ride into the
// analysis, tap → edit) + the inline daily-analysis surface. The bottom bar
// carries two CTAs: «Анализировать» (opens the kind chooser) and
// «+ Гипотеза» (manual create).
const Laboratory = ({ date, topSlot }: Props) => {
  const navigate = useNavigate();
  const hypotheses = useAllHypotheses();

  // Which hypotheses ride into the next analysis. Ephemeral UI state — lives
  // here so AnalysisCtaButton (and, through it, AnalysisKindDrawer) can read
  // the snapshot at start time.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Prune selection against the live list — a deleted hypothesis must not
  // keep inflating the «N выбрано» count or the started snapshot.
  const validSelected = useMemo(() => {
    const live = new Set(hypotheses.map((h) => h.id));
    return new Set([...selectedIds].filter((id) => live.has(id)));
  }, [selectedIds, hypotheses]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openCreate = useCallback(() => {
    void drawerStore.show(CreateHypothesisDrawer, {});
  }, []);

  const bottomBar = (
    <AppBottomBarShell side="split">
      <AnalysisCtaButton date={date} selectedIds={[...validSelected]} />
      <button
        type="button"
        className={styles.newHypothesisButton}
        onClick={openCreate}
      >
        + Гипотеза
      </button>
    </AppBottomBarShell>
  );

  return (
    <Screen stickyTop={topSlot} headerOverlap bottomBar={bottomBar}>
      <div className={styles.container}>
        <div className={styles.topLinkRow}>
          <button
            type="button"
            className={styles.weeklyLink}
            onClick={() => navigate(RouterLinks.Analyses)}
          >
            Анализ по неделям →
          </button>
        </div>

        <HypothesisListPanel
          hypotheses={hypotheses}
          selectedIds={validSelected}
          onToggle={handleToggle}
          onEditHypothesis={openEditHypothesisDrawer}
        />

        <DailyAnalysisSection date={date} />
      </div>
    </Screen>
  );
};

export default memo(Laboratory);

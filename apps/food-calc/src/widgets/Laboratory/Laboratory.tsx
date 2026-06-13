import { memo, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import Button from '@/shared/ui/atoms/Button/Button';
import FlaskIcon from '@/shared/assets/icons/flask.svg?react';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import DailyAnalysisSection from './DailyAnalysisSection';
import { openHypotheses } from './openHypotheses';
import styles from './Laboratory.module.scss';

type Props = {
  date: string;
  topSlot?: ReactNode;
};

// HomePage slot 0. Weekday heading + hollow empty-state; the only content is the
// daily-analysis surface. Bottom bar = two actions (split), unified with the
// Analyses page: «Гипотезы» (left → opens the shared HypothesesDrawer bottom-sheet)
// and «Анализировать» (right → AnalysisCtaButton: текущий день / по неделям). The
// hypotheses surface is one shared drawer reused here and on /analyses (2026-06-13,
// supersedes the navigate-to-/analyses-slide-0 entry). Weekly review is reached via
// the «По неделям» option inside the kind chooser, not a header button.
const Laboratory = ({ date, topSlot }: Props) => {
  const hasDaily = useDailyAnalysisStore((s) => Boolean(s.byDate[date]));

  const bottomBar = (
    <AppBottomBarShell side="split">
      <Button
        variant="bottomActionBar"
        onClick={() => void openHypotheses()}
        icon={<FlaskIcon width={16} height={16} />}
      >
        Гипотезы
      </Button>
      <AnalysisCtaButton date={date} />
    </AppBottomBarShell>
  );

  return (
    <Screen
      stickyTop={topSlot}
      headerOverlap
      hollow={!hasDaily}
      bottomBar={bottomBar}
    >
      <div className={styles.container}>
        {/* Лоадер анализа (гравюрный, канон tds/art-loader-canon.md) вшит в
            DailyAnalysisSection и показывается при status==='loading'.
            Вариант анимации — DesignBar anchor 'AnalysisLoader'. */}
        <DailyAnalysisSection date={date} />
      </div>
    </Screen>
  );
};

export default memo(Laboratory);

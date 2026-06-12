import { memo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import Button from '@/shared/ui/atoms/Button/Button';
import FlaskIcon from '@/shared/assets/icons/flask.svg?react';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import DailyAnalysisSection from './DailyAnalysisSection';
import styles from './Laboratory.module.scss';

type Props = {
  date: string;
  topSlot?: ReactNode;
};

// HomePage slot 0. Weekday heading + hollow empty-state; the only content is the
// daily-analysis surface. Bottom bar = two plain actions (split): «Анализировать»
// (left → AnalysisKindDrawer: текущий день / по неделям) and «Гипотезы» (right →
// navigates to /analyses slide 0, the view-first hypotheses screen). The old
// overlay HypothesisManagerModal was removed 2026-06-12 — hypotheses are now a
// proper screen, not a modal popped on top of HomePage. Weekly review is reached
// via the «По неделям» option inside the kind chooser, not a header button.
const Laboratory = ({ date, topSlot }: Props) => {
  const navigate = useNavigate();
  const hasDaily = useDailyAnalysisStore((s) => Boolean(s.byDate[date]));

  const bottomBar = (
    <AppBottomBarShell side="split">
      <AnalysisCtaButton date={date} />
      <Button
        variant="bottomActionBar"
        onClick={() => navigate('/analyses', { state: { slide: 0 } })}
        icon={<FlaskIcon width={16} height={16} />}
      >
        Гипотезы
      </Button>
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

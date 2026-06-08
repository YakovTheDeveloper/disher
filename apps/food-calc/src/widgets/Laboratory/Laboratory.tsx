import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import Button from '@/shared/ui/atoms/Button/Button';
import FlaskIcon from '@/shared/assets/icons/flask.svg?react';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { formatWeekdayTitle } from '@/shared/lib/time/formatWeekday';
import DailyAnalysisSection from './DailyAnalysisSection';
import HypothesisManagerModal from './HypothesisManagerModal';
import styles from './Laboratory.module.scss';

type Props = {
  date: string;
  topSlot?: ReactNode;
};

// HomePage slot 0. Mirrors FoodSchedule/ScheduleEvents: weekday heading +
// hollow empty-state (the brand watermark) when there is no daily analysis for
// the date. The only content is the daily-analysis surface. The bottom bar
// carries two actions: «Гипотезы» (manage hypotheses — composer + list + edit)
// and «Анализ» (kind chooser → today clarification / long analysis). Hypothesis
// selection for a run lives in the clarification modal, not here.
const Laboratory = ({ date, topSlot }: Props) => {
  const weekdayTitle = useMemo(() => formatWeekdayTitle(date), [date]);
  const hasDaily = useDailyAnalysisStore((s) => Boolean(s.byDate[date]));

  const [managerOpen, setManagerOpen] = useState(false);
  const openManager = useCallback(() => setManagerOpen(true), []);
  const closeManager = useCallback(() => setManagerOpen(false), []);

  const bottomBar = (
    <AppBottomBarShell side="split">
      <Button
        variant="bottomActionBar"
        icon={<FlaskIcon width={16} height={16} />}
        onClick={openManager}
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
      contentHeader={<Heading size="section">{weekdayTitle}</Heading>}
      overlay={
        <HypothesisManagerModal isOpen={managerOpen} onClose={closeManager} />
      }
      bottomBar={bottomBar}
    >
      <div className={styles.container}>
        <DailyAnalysisSection date={date} />
      </div>
    </Screen>
  );
};

export default memo(Laboratory);

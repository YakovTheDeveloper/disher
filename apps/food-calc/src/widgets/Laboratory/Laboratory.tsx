import { memo, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { AnalysisWriteBar } from '@/features/analysis/AnalysisWriteBar';
import { WeeklyAnalysisButton } from '@/features/analysis/WeeklyAnalysisButton';
import DailyAnalysisSection from './DailyAnalysisSection';
import HypothesisManagerModal from './HypothesisManagerModal';
import styles from './Laboratory.module.scss';

type Props = {
  date: string;
  topSlot?: ReactNode;
};

// HomePage slot 0. Weekday heading + hollow empty-state; the only content is the
// daily-analysis surface. Bottom bar = AnalysisWriteBar (2026-06-09): paperclip
// (attach hypotheses) + optional LLM message + medal «Гипотезы» that opens the
// manager / becomes SEND on focus. Weekly review moved to the top-left header
// button. The hypothesis MANAGER stays mounted as the Screen overlay so the
// medal's `<label htmlFor>` focus-delegation opens it.
const Laboratory = ({ date, topSlot }: Props) => {
  const hasDaily = useDailyAnalysisStore((s) => Boolean(s.byDate[date]));

  return (
    <Screen
      stickyTop={topSlot}
      headerOverlap
      hollow={!hasDaily}
      headerAction={<WeeklyAnalysisButton />}
      overlay={<HypothesisManagerModal />}
      bottomBar={<AnalysisWriteBar date={date} />}
    >
      <div className={styles.container}>
        <DailyAnalysisSection date={date} />
      </div>
    </Screen>
  );
};

export default memo(Laboratory);

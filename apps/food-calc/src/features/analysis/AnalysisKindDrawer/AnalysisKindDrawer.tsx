import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading } from '@/shared/ui/atoms/Typography';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import styles from './AnalysisKindDrawer.module.scss';

// `/analyses` route path — kept as a literal so this feature does not import
// from the `app` layer (FSD upward-import boundary).
const ANALYSES_ROUTE = '/analyses';

type Props = BaseDrawerProps<void> & {
  date: string;
  /** Hypothesis ids ticked in the list — snapshotted into the daily run. */
  hypothesisIds: string[];
};

function formatDay(date: string): string {
  const d = parse(date, 'dd-MM-yyyy', new Date());
  if (!isValid(d)) return date;
  return format(d, 'd MMMM, EEEE', { locale: ru });
}

// Bottom chooser opened by AnalysisCtaButton: «текущий день» (daily SSE
// review) vs «по неделям» (long polling analysis). NOT the removed
// AnalysisModeDrawer — that one picked foods-only / foods-and-events.
const AnalysisKindDrawer = ({ date, hypothesisIds, onClose }: Props) => {
  const navigate = useNavigate();
  const online = useOnline();
  const foods = useScheduleFoods(date) ?? [];
  const events = useScheduleEvents(date) ?? [];

  // The day is empty only when there is neither food nor a health event —
  // a day with food but no events is still worth a review.
  const emptyDay = foods.length === 0 && events.length === 0;
  const dailyDisabled = !online || emptyDay;

  const dailyHint = !online
    ? 'Нет сети — разбор дня недоступен'
    : emptyDay
      ? 'За этот день пока ничего не записано'
      : null;

  function startDaily() {
    if (dailyDisabled) return;
    onClose();
    void useDailyAnalysisStore.getState().start(date, { hypothesisIds });
  }

  function goLong() {
    onClose();
    navigate(ANALYSES_ROUTE);
  }

  return (
    <DrawerLayout a11yLabel="Выбор разбора">
      <div className={styles.body}>
        <Heading size="drawer">Что разобрать?</Heading>

        <button
          type="button"
          className={styles.option}
          onClick={startDaily}
          disabled={dailyDisabled}
        >
          <span className={styles.optionTitle}>Текущий день</span>
          <span className={styles.optionSub}>{formatDay(date)}</span>
          {dailyHint && <span className={styles.optionHint}>{dailyHint}</span>}
        </button>

        <button
          type="button"
          className={styles.option}
          onClick={goLong}
        >
          <span className={styles.optionTitle}>По неделям</span>
          <span className={styles.optionSub}>
            Длительный разбор за 7–35 дней
          </span>
        </button>
      </div>
    </DrawerLayout>
  );
};

export default memo(AnalysisKindDrawer);

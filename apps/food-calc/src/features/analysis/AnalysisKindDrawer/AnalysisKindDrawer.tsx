import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { modalStore, type BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionTile } from '@/shared/ui/atoms/ActionTile';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { AnalysisClarificationModal } from '../AnalysisClarificationModal';
import styles from './AnalysisKindDrawer.module.scss';

// `/analyses` route path — kept as a literal so this feature does not import
// from the `app` layer (FSD upward-import boundary).
const ANALYSES_ROUTE = '/analyses';

// Ghost art for the two option-cards (public/art). Bicycle = a single day's
// quick spin; horse-carriage = the longer multi-week journey.
const DAY_IMG = '/art/day-analysis.png';
const LONG_IMG = '/art/long-analysis.png';

type Props = BaseDrawerProps<void> & {
  date: string;
};

function formatDay(date: string): string {
  const d = parse(date, 'dd-MM-yyyy', new Date());
  if (!isValid(d)) return date;
  return format(d, 'd MMMM, EEEE', { locale: ru });
}

// Bottom chooser opened by AnalysisCtaButton: «текущий день» (daily SSE
// review) vs «по неделям» (long polling analysis). The «Что разобрать?» title
// rides the DrawerLayout chrome row; the two options follow the SearchFood
// create-pill idiom (warm chip + ghost art + serif title + ink-press).
const AnalysisKindDrawer = ({ date, onClose }: Props) => {
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
    // Close the chooser, then open the clarification modal: pick hypotheses +
    // an optional note before the daily stream starts.
    onClose();
    void modalStore.show(AnalysisClarificationModal, { date });
  }

  function goLong() {
    onClose();
    navigate(ANALYSES_ROUTE);
  }

  return (
    <DrawerLayout title="Что разобрать?">
      <div className={styles.body}>
        <ActionTile
          emphasis
          top="Текущий день"
          bottom={formatDay(date)}
          hint={dailyHint}
          art={<img src={DAY_IMG} alt="" />}
          disabled={dailyDisabled}
          onClick={startDaily}
        />
        <ActionTile
          top="По неделям"
          bottom="Длительный разбор за 7–35 дней"
          art={<img src={LONG_IMG} alt="" />}
          onClick={goLong}
        />
      </div>
    </DrawerLayout>
  );
};

export default memo(AnalysisKindDrawer);

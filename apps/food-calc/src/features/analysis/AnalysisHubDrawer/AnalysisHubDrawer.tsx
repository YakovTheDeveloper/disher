import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { modalStore, type BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionTile, ArrowGlyph } from '@/shared/ui/atoms/ActionTile';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { AnalysisClarificationModal } from '../AnalysisClarificationModal';
import styles from './AnalysisHubDrawer.module.scss';

// Route literals — kept inline so this feature does not import from the `app`
// layer (FSD upward-import boundary).
const ANALYSES_ROUTE = '/analyses';
const DISCOVERIES_ROUTE = '/discoveries';

// Ghost art (public/art). Bicycle = a single day's quick spin; horse-carriage =
// the longer multi-week journey. «Мои открытия» carries a plain nav arrow — it
// is a route hop, not an analysis kind.
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

// «Разбор» hub — the persistent navigation anchor that replaced Home's removed
// analysis slide. Opened from the «О!» button on HomeTopBar (drawerStore).
// Three options: «Разобрать день» (window=1 daily flow → clarification modal),
// «Разобрать недели» (long analysis list), «Мои открытия» (hypotheses +
// insights). The daily row is gated (offline / empty day) exactly as the former
// AnalysisKindDrawer «Текущий день».
const AnalysisHubDrawer = ({ date, onClose }: Props) => {
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
    // Close the hub, then open the clarification modal: pick hypotheses + an
    // optional note before the daily (window=1) analysis starts.
    onClose();
    void modalStore.show(AnalysisClarificationModal, { date });
  }

  function goWeeks() {
    onClose();
    navigate(ANALYSES_ROUTE);
  }

  function goDiscoveries() {
    onClose();
    navigate(DISCOVERIES_ROUTE);
  }

  return (
    <DrawerLayout title="Разбор">
      <div className={styles.body}>
        <ActionTile
          emphasis
          top="Разобрать день"
          bottom={formatDay(date)}
          hint={dailyHint}
          art={<img src={DAY_IMG} alt="" />}
          disabled={dailyDisabled}
          onClick={startDaily}
        />
        <ActionTile
          top="Разобрать недели"
          bottom="Длительный разбор за 7–35 дней"
          art={<img src={LONG_IMG} alt="" />}
          onClick={goWeeks}
        />
        <ActionTile
          top="Мои открытия"
          bottom="Гипотезы и инсайты"
          art={<ArrowGlyph dir="right" />}
          onClick={goDiscoveries}
        />
      </div>
    </DrawerLayout>
  );
};

export default memo(AnalysisHubDrawer);

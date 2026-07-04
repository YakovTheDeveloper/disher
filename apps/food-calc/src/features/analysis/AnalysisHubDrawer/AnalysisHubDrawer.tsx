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
import { CreateLongAnalysisModal } from '../long';
import styles from './AnalysisHubDrawer.module.scss';

// Route literals — kept inline so this feature does not import from the `app`
// layer (FSD upward-import boundary).
const ANALYSES_ROUTE = '/analyses';

// Ghost art (public/art). Bicycle = a single day's quick spin; horse-carriage =
// the longer multi-week journey.
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

// «Разбор» hub — the create fork for /analyses. Opened from the «О!» button on
// HomeTopBar (date = the schedule date) and from the «Создать анализ» button on
// the /analyses list (date = today). Two options: «Разобрать день» (window=1
// daily flow → clarification modal) and «Разобрать недели» (long analysis create
// modal). Both hand the fresh pending row to /analyses via navigation
// `state.justStarted`, so the feed hook seeds it optimistically the same way. The
// daily row is gated (offline / empty day) exactly as the former
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

  async function startLong() {
    // Close the hub, open the long-analysis create modal, then hand the fresh
    // pending row to /analyses via `state.justStarted` — the feed hook seeds it
    // optimistically (same path as the daily flow). Dismissed → stay put.
    onClose();
    const created = await modalStore.show(CreateLongAnalysisModal, {});
    if (created) navigate(ANALYSES_ROUTE, { state: { justStarted: created } });
  }

  // Нав-плитка в раздел «Открытия» (инсайты + гипотезы — они переехали в /analyses).
  // Не создаёт разбор, а уводит на страницу → тёмная inverse-плитка отделяет «нав»
  // от белых опций-создания выше.
  function openDiscoveries() {
    onClose();
    navigate(ANALYSES_ROUTE);
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
          onClick={startLong}
        />
        <ActionTile
          inverse
          top="Страница открытий"
          bottom="Инсайты и гипотезы с твоих разборов"
          onClick={openDiscoveries}
        />
      </div>
    </DrawerLayout>
  );
};

export default memo(AnalysisHubDrawer);

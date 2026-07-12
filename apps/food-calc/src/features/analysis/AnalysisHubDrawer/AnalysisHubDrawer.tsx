import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { modalStore, type BaseDrawerProps } from '@/shared/ui';
import { drawerStore } from '@/shared/ui/drawer-store';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionList } from '@/shared/ui/ActionList';
import { InfoButton } from '@/shared/ui/atoms/Button';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { AboutDiscoveriesDrawer } from './AboutDiscoveriesDrawer';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { AnalysisClarificationModal } from '../AnalysisClarificationModal';
import { CreateLongAnalysisModal } from '../long';
import CalendarDayIcon from '@/shared/assets/icons/calendar-day.svg?react';
import CalendarRangeIcon from '@/shared/assets/icons/calendar-range.svg?react';
import LightbulbIcon from '@/shared/assets/icons/lightbulb.svg?react';
import styles from './AnalysisHubDrawer.module.scss';

// Route literals — kept inline so this feature does not import from the `app`
// layer (FSD upward-import boundary).
const ANALYSES_ROUTE = '/analyses';

type Props = BaseDrawerProps<void> & {
  date: string;
  // Скрыть нав-плитку «Страница открытий»: на самой /analyses она вела бы на себя
  // же (self-referencing). На Home плитка нужна — уводит в раздел открытий.
  hideDiscoveriesLink?: boolean;
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
const AnalysisHubDrawer = ({ date, onClose, hideDiscoveriesLink = false }: Props) => {
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
    <DrawerLayout
      title="Открытия"
      // ⓘ стекает объяснялку ПОВЕРХ хаба (хаб не закрываем) — «что такое разборы,
      // инсайты, гипотезы и куда всё копится». Тихий ghost-глиф в chrome-слоте.
      topRight={
        <InfoButton
          tone="ghost"
          emphasis="quiet"
          glyphSize={20}
          aria-label="Об открытиях"
          onClick={() => void drawerStore.show(AboutDiscoveriesDrawer, {})}
        />
      }
    >
      {/* Две секции ActionList: «Анализ» (создать разбор) и «Перейти» (уйти на
          страницу открытий). Ряды — плоские SettingRow, делит тающая бровка. Секции
          = h3 (заголовок дровера h2 → тело держит следующий ярус, корректный
          outline). Причина недоступности «Разобрать день» (офлайн / пустой день)
          едет в `sub`. */}
      <ActionList>
        <ActionList.Section as="h3" label="Анализ">
          <div className={styles.rows}>
            <SettingRow
              icon={<CalendarDayIcon width={18} height={18} />}
              label="Разобрать день"
              sub={dailyDisabled ? (dailyHint ?? undefined) : formatDay(date)}
              trailing={<ChevronGlyph />}
              onClick={startDaily}
              disabled={dailyDisabled}
            />
            <SettingRow
              icon={<CalendarRangeIcon width={18} height={18} />}
              label="Разобрать недели"
              sub="Длительный разбор за 7–35 дней"
              trailing={<ChevronGlyph />}
              onClick={startLong}
            />
          </div>
        </ActionList.Section>

        {!hideDiscoveriesLink && (
          <ActionList.Section as="h3" label="Перейти">
            <div className={styles.rows}>
              <SettingRow
                icon={<LightbulbIcon width={18} height={18} />}
                label="Страница открытий"
                sub="Инсайты и гипотезы с твоих разборов"
                trailing={<ChevronGlyph />}
                onClick={openDiscoveries}
              />
            </div>
          </ActionList.Section>
        )}
      </ActionList>
    </DrawerLayout>
  );
};

export default memo(AnalysisHubDrawer);

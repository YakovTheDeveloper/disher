import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addDays,
  format,
  getDay,
  getDaysInMonth,
  isSameDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import clsx from 'clsx';
import { RoundButton } from '@/shared/ui/RoundButton';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { EmptyState } from '@/shared/ui/EmptyState';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { ArcLabel } from '@/shared/ui/ArcLabel/ArcLabel';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';
import { deriveFilledDates, useFilledDateKeys, useToday } from './hooks';
import { DATE_FORMAT, groupByMonth, parseKeys, type ParsedDay } from './lib';
import type { DateStr } from './model';
import s from './ScheduleNavigator.module.scss';

interface Props {
  onSelect: (date: DateStr) => void;
  selectedDate?: DateStr;
  /** Какой экран дровера рендерим: корень (быстрый переход) или все дни (календари). */
  screen?: 'root' | 'days';
  /** Клик по ряду «Показать все дни» — переводит дровер на вторую страницу. */
  onShowAllDays?: () => void;
}

// ─── Быстрый переход — три круглые медали-стрелки ───────────────────────────
// Вчера ← / сегодня ↓ / завтра →. Голая медаль RoundButton в button-режиме
// (onClick, без htmlFor): дуга-слово сверху, короткая дата снизу, стрелка-глиф
// по центру. Стиль стрелки — горизонтальная стрелка (как ArrowGlyph в ActionTile),
// зеркалим для «влево», поворачиваем 90° для «вниз».
function NavArrow({ dir }: { dir: 'left' | 'right' | 'down' }) {
  const transform = dir === 'left' ? 'scaleX(-1)' : dir === 'down' ? 'rotate(90deg)' : undefined;
  return (
    <svg
      className={s.quickGlyph}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={transform ? { transform } : undefined}
    >
      <path
        d="M5 12h13M13 6.5 18.5 12 13 17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface QuickNavProps {
  day: ParsedDay;
  relative: 'вчера' | 'сегодня' | 'завтра';
  dir: 'left' | 'right' | 'down';
  onSelect: (dateStr: DateStr) => void;
}

const QuickNav = memo(function QuickNav({ day, relative, dir, onSelect }: QuickNavProps) {
  // 'EEEEEE' = short standalone weekday in ru ("пн", …). dd.MM — дата; «d MMMM» —
  // человеко-читаемая дата в a11y-имени («Завтра, 16 мая»).
  const weekdayShort = format(day.date, 'EEEEEE', { locale: ru });
  const ddmm = format(day.date, 'dd.MM');
  const longDate = format(day.date, 'd MMMM', { locale: ru });
  const cap = relative.charAt(0).toUpperCase() + relative.slice(1);

  return (
    <RoundButton
      look="bare"
      floating={false}
      onClick={() => onSelect(day.dateStr)}
      ariaLabel={`${cap}, ${longDate}`}
      centerNode={<NavArrow dir={dir} />}
      arcTop={relative}
      arcBottom={`${weekdayShort} · ${ddmm}`}
    />
  );
});

// ─── MonthCalendar (active-days — real 7-col mini-grid) ────────────────────
// Настоящая календарная решётка пн→вс на месяц: активные дни (есть записи) —
// яркие тапаемые ячейки, пустые — тусклый контекст (нетапаемые). Форма данных
// («логировал первую половину месяца, потом бросил») читается тепловой картой.
// today — кольцо, выбранный — заливка. Monday-first: смещение = (getDay+6)%7.
// Подписи колонок месяц НЕ несёт — они одни на весь поток (см. .weekdayRowSticky).
const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

// Шапка под-экрана «Все дни» — ЗАГОЛОВОК + подписи колонок, живёт в chrome-ряду
// дровера (DrawerLayout `header`), а не в теле. Раньше строка «пн…вс» липла к верху
// скроллера своим `position: sticky` и дралась за верх с пришпиленной шапкой дровера
// (цифры просвечивали между двумя полосами). Колонки пн→вс одинаковы во ВСЕХ месяцах,
// так что подпись — свойство ЭКРАНА, а не потока: её законное место — шапка.
// Ряд подписей вырывается из жёлоба центрального слота отрицательными полями
// (`.weekdayRowHeader`), чтобы его 7 колонок сели ровно на решётку тела.
export function AllDaysHeader() {
  return (
    <div className={s.daysHeader}>
      {/* `as="p"` — не h2: единственный <h2> дровера сейчас sr-only Drawer.Title
          (см. DrawerLayout: кастомный header гасит видимый заголовок). */}
      <Heading role="headline" as="p" className={s.daysHeaderTitle}>
        Все дни
      </Heading>
      <div className={clsx(s.weekdayRow, s.weekdayRowHeader)} aria-hidden>
        {WEEKDAY_LABELS.map((w) => (
          <Text key={w} as="span" role="caption" className={s.weekday}>
            {w}
          </Text>
        ))}
      </div>
    </div>
  );
}

interface MonthCalendarProps {
  monthDate: Date;
  name: string;
  year: string;
  filledSet: Set<DateStr>;
  today: Date;
  selectedDate?: DateStr;
  onSelect: (dateStr: DateStr) => void;
}

const MonthCalendar = memo(function MonthCalendar({
  monthDate,
  name,
  year,
  filledSet,
  today,
  selectedDate,
  onSelect,
}: MonthCalendarProps) {
  const monthStart = startOfMonth(monthDate);
  const daysInMonth = getDaysInMonth(monthStart);
  const lead = (getDay(monthStart) + 6) % 7; // сколько пустых ячеек до 1-го числа

  const cells: Array<number | null> = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  return (
    <div className={s.month}>
      <Heading role="title" className={s.monthHeading}>
        {name}
        {"'"}
        {year}
      </Heading>
      <div className={s.grid}>
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} className={s.blank} aria-hidden />;
          const date = addDays(monthStart, d - 1);
          const dateStr = format(date, DATE_FORMAT) as DateStr;
          const isActive = filledSet.has(dateStr);
          const isToday = isSameDay(date, today);
          const isSelected = dateStr === selectedDate;

          // Любой день тапаем — прыжок ведёт и в пустой день. Активный «залит»
          // (тепловая карта), пустой — тихий бледный контекст, но остаётся кнопкой.
          return (
            <button
              key={dateStr}
              type="button"
              data-date={dateStr}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              className={clsx(
                s.cell,
                isActive ? s.cellActive : s.cellEmpty,
                isToday && s.cellToday,
                isSelected && s.cellSelected
              )}
              onClick={() => onSelect(dateStr)}
            >
              <Text as="span" role="card-caption">
                {d}
              </Text>
              {/* «Сегодня» — дуговой штемпель НАД цифрой (тот же ArcLabel, что вид-бейдж
                  в «Мое»): ориентир читается словом, а не кольцом. */}
              {isToday && <ArcLabel text="сегодня" className={s.todayArc} />}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export const ScheduleNavigator = ({
  onSelect,
  selectedDate,
  screen = 'root',
  onShowAllDays,
}: Props) => {
  const { t } = useTranslation();
  const today = useToday();
  const filledKeys = useFilledDateKeys();

  const yesterdayStr = useMemo(() => format(subDays(today, 1), DATE_FORMAT), [today]);
  const todayStr = useMemo(() => format(today, DATE_FORMAT), [today]);
  const tomorrowStr = useMemo(() => format(addDays(today, 1), DATE_FORMAT), [today]);

  const filledAsc = useMemo(() => parseKeys(filledKeys), [filledKeys]);
  const filledSet = useMemo(() => deriveFilledDates(filledKeys), [filledKeys]);

  // «Активные дни» = ВСЕ дни с записями (прошлое + сегодня + будущее),
  // сгруппированы по месяцам DESCENDING (новые→старые): самый актуальный месяц —
  // сверху, ранние дни ищутся скроллом вниз. Внутри месяца сетка остаётся 1→31
  // (календарь читается сверху-вниз), .reverse() переставляет только ПОРЯДОК
  // месяцев (groupByMonth возвращает свежий массив — мутация безопасна).
  const activeGroups = useMemo(() => groupByMonth(filledAsc).reverse(), [filledAsc]);
  const hasActive = filledAsc.length > 0;

  const anchors: ParsedDay[] = useMemo(
    () => [
      { date: subDays(today, 1), dateStr: yesterdayStr },
      { date: today, dateStr: todayStr },
      { date: addDays(today, 1), dateStr: tomorrowStr },
    ],
    [today, yesterdayStr, todayStr, tomorrowStr]
  );

  // Автоскролла к текущему месяцу НЕТ (снят 2026-07-12): дровер открывается в
  // покое, сверху — «Быстрый переход», месяцы идут новые→старые и листаются
  // пальцем. Прокрутка «за тебя» уводила быстрые медали с экрана.

  // Под-экран «Все дни» — только поток месяцев (просьба 2026-07-12): календари
  // высокие, на корне они топили быстрый переход. Вход — ряд-навигация внизу корня,
  // выход — стрелка «Назад» в шапке (см. ScheduleNavigatorDrawer).
  if (screen === 'days') {
    return (
      <div className={s.shell}>
        {hasActive ? (
          <div className={s.months}>
            {activeGroups.map((g) => (
              <MonthCalendar
                key={g.key}
                monthDate={g.items[0].date}
                name={g.name}
                year={g.year}
                filledSet={filledSet}
                today={today}
                selectedDate={selectedDate}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className={s.empty}>
            <EmptyState title={t('schedule.empty.days.title')} />
          </div>
        )}
      </div>
    );
  }

  // Корень — без ActionList/секций (сняты 2026-07-12): два блока без подписей,
  // ярусы отступов держит `.shell` сам. Заголовки секций дублировали бы название
  // дровера, а ряд «Показать все дни» говорит за себя.
  return (
    <div className={s.shell}>
      <div className={s.quickRow}>
        <QuickNav day={anchors[0]} relative="вчера" dir="left" onSelect={onSelect} />
        <QuickNav day={anchors[1]} relative="сегодня" dir="down" onSelect={onSelect} />
        <QuickNav day={anchors[2]} relative="завтра" dir="right" onSelect={onSelect} />
      </div>

      {/* Вход на под-экран календарей. Без записей ряд недоступен — второй экран
          показал бы пустой EmptyState, а причина читается прямо в `sub`. */}
      <SettingRow
        icon={<CalendarIcon width={18} height={18} />}
        label="Показать все дни"
        sub={hasActive ? undefined : 'Пока нет ни одной записи'}
        disabled={!hasActive}
        trailing={<ChevronGlyph />}
        onClick={onShowAllDays}
        aria-label="Показать все дни с записями"
      />
    </div>
  );
};

export default ScheduleNavigator;

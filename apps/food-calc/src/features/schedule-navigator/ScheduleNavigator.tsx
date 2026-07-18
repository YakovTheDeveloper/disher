import { memo, useId, useMemo } from 'react';
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
import { Well } from '@/shared/ui/Well';
import { ActionList } from '@/shared/ui/ActionList';
import { Heading, Numeral, Text } from '@/shared/ui/atoms/Typography';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { IconButton } from '@/shared/ui/atoms/Button';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { ArcLabel } from '@/shared/ui/ArcLabel/ArcLabel';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';
import { deriveFilledDates, useFilledDateKeys, useToday } from './hooks';
import { DATE_FORMAT, type ParsedDay } from './lib';
import type { DateStr } from './model';
import s from './ScheduleNavigator.module.scss';

interface Props {
  onSelect: (date: DateStr) => void;
  selectedDate?: DateStr;
  /** Какой экран дровера рендерим: корень (быстрый переход) или все дни (календарь). */
  screen?: 'root' | 'days';
  /** Месяц, показываемый на под-экране «Все дни» (пейджится стрелками в шапке). */
  viewMonth?: Date;
  /** Клик по ряду «Показать все дни» — переводит дровер на вторую страницу. */
  onShowAllDays?: () => void;
}

// ─── Быстрый переход — три круглые медали-даты ──────────────────────────────
// Вчера / сегодня / завтра. Беспоке-монета (surface-2 + чёрный кант, плоская): дуга-
// слово сверху, дата (крупное число + день недели в ряд) по центру. RoundButton не
// расширяем — его центр = глиф/картинка, низ = ТЕКСТ-дуга, облик bare/flat/elevated;
// тут центр = дата, фон/кант другие. Расходящиеся пропы испортили бы общую монету
// (Food/Analysis/ItemActions), поэтому монета живёт локально; общей осталась лишь
// идиома верхней дуги-слова через <textPath> (повторена ниже).
interface QuickNavProps {
  day: ParsedDay;
  relative: 'вчера' | 'сегодня' | 'завтра';
  onSelect: (dateStr: DateStr) => void;
}

const QuickNav = memo(function QuickNav({ day, relative, onSelect }: QuickNavProps) {
  // 'EEEEEE' = short standalone weekday in ru ("пн", …); 'd' — число дня (доминанта
  // центра); «d MMMM» — человеко-читаемая дата в a11y-имени («Завтра, 16 мая»).
  const weekdayShort = format(day.date, 'EEEEEE', { locale: ru });
  const dayNum = format(day.date, 'd');
  const longDate = format(day.date, 'd MMMM', { locale: ru });
  const cap = relative.charAt(0).toUpperCase() + relative.slice(1);

  const { pressed, pressProps } = usePressFeedback();
  // Уникальный id пути верхней дуги — <textPath> ссылается на него по #id.
  const arcTopId = `${useId().replace(/:/g, '')}-nav-top`;

  return (
    <button
      type="button"
      className={s.medal}
      aria-label={`${cap}, ${longDate}`}
      onClick={() => onSelect(day.dateStr)}
      data-pressed={pressed || undefined}
      {...pressProps}
    >
      <span className={s.medalDate} aria-hidden>
        <Numeral as="span" size="xl" weight="semibold" className={s.medalDay}>
          {dayNum}
        </Numeral>
        <Text as="span" role="caption" className={s.medalWeekday}>
          {weekdayShort}
        </Text>
        <ChevronGlyph className={s.medalChevron} />
      </span>
      <svg className={s.medalArc} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id={arcTopId} d="M 14,50 A 36,36 0 0 1 86,50" fill="none" />
        </defs>
        <text>
          <textPath href={`#${arcTopId}`} startOffset="50%" textAnchor="middle">
            {relative}
          </textPath>
        </text>
      </svg>
    </button>
  );
});

// ─── MonthCalendar (active-days — real 7-col mini-grid) ────────────────────
// Настоящая календарная решётка пн→вс на месяц: активные дни (есть записи) —
// яркие тапаемые ячейки, пустые — тусклый контекст (тапаемые). Форма данных
// («логировал первую половину месяца, потом бросил») читается тепловой картой.
// today — кольцо, выбранный — заливка. Monday-first: смещение = (getDay+6)%7.
// Имя месяца + подписи колонок несёт шапка (AllDaysHeader) — они свойство ЭКРАНА,
// а не решётки: показываем ровно ОДИН месяц, пейджим его стрелками в chrome-ряду.
const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

interface AllDaysHeaderProps {
  monthDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

// Шапка под-экрана «Все дни» — помесячная навигация (‹ Май'26 ›) + подписи колонок,
// живёт в chrome-ряду дровера (DrawerLayout `header`), а не в теле. Стрелки пейджат
// показываемый месяц (state поднят в ScheduleNavigatorDrawer). Колонки пн→вс одинаковы
// во ВСЕХ месяцах, так что подпись — свойство ЭКРАНА: её дом — шапка. Ряд подписей
// вырывается из жёлоба центрального слота отрицательными полями (`.weekdayRowHeader`),
// чтобы его 7 колонок сели ровно на решётку тела.
export function AllDaysHeader({ monthDate, onPrev, onNext }: AllDaysHeaderProps) {
  return (
    <div className={s.daysHeader}>
      <div className={s.monthNav}>
        {/* `as="p"` — не h2: единственный <h2> дровера сейчас sr-only Drawer.Title
            (см. DrawerLayout: кастомный header гасит видимый заголовок). */}
        <Heading role="title" as="p" className={s.monthNavLabel}>
          {format(monthDate, 'LLLL', { locale: ru })}
          {"'"}
          {format(monthDate, 'yy')}
        </Heading>
        {/* Пейджинг ‹ › собран в один блок у правой кромки — навигация справа. */}
        <div className={s.navArrows}>
          <IconButton
            tone="soft"
            size={40}
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Предыдущий месяц"
            icon={<ChevronGlyph className={s.navChevronPrev} width={20} height={20} />}
          />
          <IconButton
            tone="soft"
            size={40}
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Следующий месяц"
            icon={<ChevronGlyph width={20} height={20} />}
          />
        </div>
      </div>
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
  filledSet: Set<DateStr>;
  today: Date;
  selectedDate?: DateStr;
  onSelect: (dateStr: DateStr) => void;
}

const MonthCalendar = memo(function MonthCalendar({
  monthDate,
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
  // Добиваем сетку до 6 недель (42 ячейки) хвостовыми пустышками: короткие
  // месяцы (4–5 рядов) иначе давали КАЛЕНДАРЬ РАЗНОЙ ВЫСОТЫ, и пейджинг ‹ › дёргал
  // высоту дровера. Пустышки — нетапаемый отступ снизу, высота всегда одна (6 рядов).
  while (cells.length < 42) cells.push(null);

  return (
    <div className={s.month}>
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
  viewMonth,
  onShowAllDays,
}: Props) => {
  const today = useToday();
  const filledKeys = useFilledDateKeys();

  const yesterdayStr = useMemo(() => format(subDays(today, 1), DATE_FORMAT), [today]);
  const todayStr = useMemo(() => format(today, DATE_FORMAT), [today]);
  const tomorrowStr = useMemo(() => format(addDays(today, 1), DATE_FORMAT), [today]);

  const filledSet = useMemo(() => deriveFilledDates(filledKeys), [filledKeys]);
  const hasActive = (filledKeys?.length ?? 0) > 0;

  const anchors: ParsedDay[] = useMemo(
    () => [
      { date: subDays(today, 1), dateStr: yesterdayStr },
      { date: today, dateStr: todayStr },
      { date: addDays(today, 1), dateStr: tomorrowStr },
    ],
    [today, yesterdayStr, todayStr, tomorrowStr]
  );

  // Под-экран «Все дни» — ОДИН месяц-календарь (вариант B, 2026-07-18): классическая
  // помесячная навигация ‹ › в шапке (AllDaysHeader), стартует с текущего месяца.
  // Раньше рендерился поток месяцев ТОЛЬКО с записями — пустые месяцы (будущее/прошлое
  // без данных) были недостижимы. Теперь любой месяц пейджится стрелками; активные дни
  // подсвечены тепловой картой (filledSet), пустые остаются тапаемыми целями прыжка.
  if (screen === 'days') {
    return (
      <div className={s.shell}>
        <MonthCalendar
          monthDate={viewMonth ?? today}
          filledSet={filledSet}
          today={today}
          selectedDate={selectedDate}
          onSelect={onSelect}
        />
      </div>
    );
  }

  // Корень — ActionList с ДВУМЯ секциями (просьба 2026-07-18): «Быстрый переход»
  // (три монеты-даты) и «Прошлая активность» (вход в календарь дней с записями).
  // Меж-секционный ярус + зазор заголовок→контент держит сам ActionList.
  return (
    <ActionList>
      <ActionList.Section as="h3" label="Быстрый переход" italicLabel>
        {/* Три беспоке-монеты в утопленном лотке Well (variant="round" — капсульный
            радиус + холодная бледная канавка под surface-2 монеты). */}
        <Well variant="round">
          <div className={s.quickRow}>
            <QuickNav day={anchors[0]} relative="вчера" onSelect={onSelect} />
            <QuickNav day={anchors[1]} relative="сегодня" onSelect={onSelect} />
            <QuickNav day={anchors[2]} relative="завтра" onSelect={onSelect} />
          </div>
        </Well>
      </ActionList.Section>

      <ActionList.Section as="h3" label="Прошлая активность" italicLabel>
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
      </ActionList.Section>
    </ActionList>
  );
};

export default ScheduleNavigator;

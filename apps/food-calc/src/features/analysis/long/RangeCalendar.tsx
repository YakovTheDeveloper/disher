import { memo, useMemo } from 'react';
import {
  addDays,
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import clsx from 'clsx';
import { QuietLabel, Text } from '@/shared/ui/atoms/Typography';
import type { DateRange } from './range';
import s from './RangeCalendar.module.scss';

// Инлайн-календарь окна разбора. СТРУКТУРА решётки (month-заголовок, шапка дней
// недели, grid, база ячейки) — общий миксин `calendar-grid()` (mixin.scss), тот
// же источник, что мини-календари «Активные дни» в ScheduleNavigator. Отличие —
// семантика: тут выбирается ДИАПАЗОН (два конца + полоса между), все дни в
// пределах [min, max] тапаемы; вне окна — тихий нетапаемый контекст. Заменил
// нативный `<input type=date>` popup (OS-chrome, не стилизуется) — 2026-07-05.

const WEEKDAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const ISO = 'yyyy-MM-dd';

type Props = {
  value: DateRange;
  /** `yyyy-MM-dd` — самый ранний тапаемый день (включительно). */
  min: string;
  /** `yyyy-MM-dd` — самый поздний тапаемый день (включительно, обычно «сегодня»). */
  max: string;
  onSelectDay: (dateStr: string) => void;
};

interface MonthBlockProps {
  monthStart: Date;
  minDate: Date;
  maxDate: Date;
  startD: Date | null;
  endD: Date | null;
  today: Date;
  onSelectDay: (dateStr: string) => void;
}

const MonthBlock = memo(function MonthBlock({
  monthStart,
  minDate,
  maxDate,
  startD,
  endD,
  today,
  onSelectDay,
}: MonthBlockProps) {
  const daysInMonth = getDaysInMonth(monthStart);
  const lead = (getDay(monthStart) + 6) % 7; // пустых ячеек до 1-го числа (пн-first)

  const cells: Array<number | null> = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  return (
    <div className={s.month}>
      <QuietLabel className={s.monthName}>
        {format(monthStart, 'LLLL', { locale: ru })}
        {"'"}
        {format(monthStart, 'yy')}
      </QuietLabel>
      <div className={s.weekdayRow} aria-hidden>
        {WEEKDAY_LABELS.map((w) => (
          <Text key={w} as="span" role="caption" className={s.weekday}>
            {w}
          </Text>
        ))}
      </div>
      <div className={s.grid}>
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} className={s.blank} aria-hidden />;
          const date = addDays(monthStart, d - 1);
          const dateStr = format(date, ISO);
          const isToday = isSameDay(date, today);
          const selectable = !isBefore(date, minDate) && !isAfter(date, maxDate);

          // День вне окна выбора (будущее / раньше границы) — тихий контекст, не кнопка.
          if (!selectable) {
            return (
              <span
                key={dateStr}
                className={clsx(s.cell, s.disabled, isToday && s.today)}
                aria-hidden
              >
                <Text as="span" role="body">
                  {d}
                </Text>
              </span>
            );
          }

          const isStart = !!startD && isSameDay(date, startD);
          const isEnd = !!endD && isSameDay(date, endD);
          const inRange =
            !!startD && !!endD && isAfter(date, startD) && isBefore(date, endD);

          return (
            <button
              key={dateStr}
              type="button"
              data-date={dateStr}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isStart || isEnd}
              className={clsx(
                s.cell,
                s.day,
                inRange && s.inRange,
                isStart && s.rangeStart,
                isEnd && s.rangeEnd,
                isToday && s.today
              )}
              onClick={() => onSelectDay(dateStr)}
            >
              {/* Цифры дня = role="body" (16px, единый кегль всех ячеек). Концы
                  диапазона несут вес через примитив (weight="bold"), раньше — сырой
                  font-weight:600 в .rangeStart/.rangeEnd. */}
              <Text as="span" role="body" weight={isStart || isEnd ? 'bold' : undefined}>
                {d}
              </Text>
            </button>
          );
        })}
      </div>
    </div>
  );
});

const RangeCalendar = ({ value, min, max, onSelectDay }: Props) => {
  const minDate = useMemo(() => startOfDay(parseISO(min)), [min]);
  const maxDate = useMemo(() => startOfDay(parseISO(max)), [max]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const startD = useMemo(() => {
    const d = value.start ? startOfDay(parseISO(value.start)) : null;
    return d && isValid(d) ? d : null;
  }, [value.start]);
  const endD = useMemo(() => {
    const d = value.end ? startOfDay(parseISO(value.end)) : null;
    return d && isValid(d) ? d : null;
  }, [value.end]);

  // Стек месяцев min→max (ascending). Сегодня — в последнем месяце (низ).
  const months = useMemo(() => {
    const out: Date[] = [];
    let m = startOfMonth(minDate);
    const last = startOfMonth(maxDate);
    while (!isAfter(m, last)) {
      out.push(m);
      m = addMonths(m, 1);
    }
    return out;
  }, [minDate, maxDate]);

  return (
    <div className={s.root}>
      {months.map((m) => (
        <MonthBlock
          key={format(m, 'yyyy-MM')}
          monthStart={m}
          minDate={minDate}
          maxDate={maxDate}
          startD={startD}
          endD={endD}
          today={today}
          onSelectDay={onSelectDay}
        />
      ))}
    </div>
  );
};

export default memo(RangeCalendar);

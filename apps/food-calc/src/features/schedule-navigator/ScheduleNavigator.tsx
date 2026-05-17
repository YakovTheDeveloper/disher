import { memo, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  subDays,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { deriveFilledDates, useFilledDateKeys, useToday } from './hooks';
import {
  computePastFilledAsc,
  DATE_FORMAT,
  groupByMonth,
  parseKeys,
  type ParsedDay,
} from './lib';
import type { DateStr } from './model';
import s from './ScheduleNavigator.module.scss';

interface Props {
  onSelect: (date: DateStr) => void;
  selectedDate?: DateStr;
}

// ─── DayRow (anchors — full-width, three of them) ──────────────────────────
interface DayRowProps {
  day: ParsedDay;
  today: Date;
  isFilled: boolean;
  isSelected: boolean;
  onSelect: (dateStr: DateStr) => void;
}

const DayRow = memo(function DayRow({
  day,
  today,
  isFilled,
  isSelected,
  onSelect,
}: DayRowProps) {
  const handleClick = useCallback(() => onSelect(day.dateStr), [day.dateStr, onSelect]);

  const isToday = isSameDay(day.date, today);
  const diff = differenceInCalendarDays(day.date, today);
  const relativeLabel =
    diff === 0 ? 'сегодня' : diff === -1 ? 'вчера' : diff === 1 ? 'завтра' : null;

  const weekday = format(day.date, 'EEEE', { locale: ru });
  const dayNumber = format(day.date, 'd');
  const monthLong = format(day.date, 'LLLL', { locale: ru });

  const className = [
    s.dayRow,
    isFilled && s.dayRowFilled,
    !isFilled && s.dayRowEmpty,
    isToday && s.dayRowToday,
    isSelected && s.dayRowSelected,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      data-date={day.dateStr}
    >
      <span className={s.dayAccent} aria-hidden />
      {relativeLabel && <span className={s.dayRelative}>{relativeLabel}</span>}
      {/* HomeTopBar date pattern: big serif day + tiny stacked weekday/month. */}
      <span className={s.dayNumeral}>
        <span className={s.dayNumeralDay}>{dayNumber}</span>
        <span className={s.dayNumeralMeta}>
          <span>{weekday}</span>
          <span>{monthLong}</span>
        </span>
      </span>
    </button>
  );
});

// ─── DayChip (past — compact, flex-wrap) ───────────────────────────────────
interface DayChipProps {
  day: ParsedDay;
  today: Date;
  isSelected: boolean;
  onSelect: (dateStr: DateStr) => void;
}

const DayChip = memo(function DayChip({
  day,
  today,
  isSelected,
  onSelect,
}: DayChipProps) {
  const handleClick = useCallback(() => onSelect(day.dateStr), [day.dateStr, onSelect]);
  const isToday = isSameDay(day.date, today);
  const dayNumber = format(day.date, 'd');
  // 'EEEEEE' = short standalone in ru locale ("пн", "вт", ...). Compact and
  // unambiguous unlike narrow 1-char form.
  const weekdayShort = format(day.date, 'EEEEEE', { locale: ru });

  const className = [
    s.dayChip,
    isToday && s.dayChipToday,
    isSelected && s.dayChipSelected,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      data-date={day.dateStr}
    >
      <span className={s.dayChipNumber}>{dayNumber}</span>
      <span className={s.dayChipWeekday}>{weekdayShort}</span>
    </button>
  );
});

// ─── ScheduleNavigator ─────────────────────────────────────────────────────
export const ScheduleNavigator = ({ onSelect, selectedDate }: Props) => {
  const today = useToday();
  const filledKeys = useFilledDateKeys();

  const todayStr = useMemo(() => format(today, DATE_FORMAT), [today]);
  const yesterdayStr = useMemo(() => format(subDays(today, 1), DATE_FORMAT), [today]);
  const tomorrowStr = useMemo(() => format(addDays(today, 1), DATE_FORMAT), [today]);

  const filledAsc = useMemo(() => parseKeys(filledKeys), [filledKeys]);
  const filledSet = useMemo(() => deriveFilledDates(filledKeys), [filledKeys]);

  const pastFilledAsc = useMemo(
    () => computePastFilledAsc(filledAsc, today),
    [filledAsc, today],
  );
  const pastGroups = useMemo(() => groupByMonth(pastFilledAsc), [pastFilledAsc]);

  const yesterday = useMemo(() => subDays(today, 1), [today]);
  const anchors: ParsedDay[] = useMemo(
    () => [
      { date: yesterday, dateStr: yesterdayStr },
      { date: today, dateStr: todayStr },
      { date: addDays(today, 1), dateStr: tomorrowStr },
    ],
    [yesterday, yesterdayStr, today, todayStr, tomorrowStr],
  );

  const handleSelect = useCallback((dateStr: DateStr) => onSelect(dateStr), [onSelect]);

  // After hydration: if selectedDate is inside the past chips, centre it; else
  // pin scroll to the bottom so the newest past day sits flush against the
  // anchor block. Without this branch a far-in-past selectedDate would be
  // silently invisible if it scrolled outside the visible area.
  const pastSectionRef = useRef<HTMLDivElement>(null);
  const hasPast = pastFilledAsc.length > 0;
  useLayoutEffect(() => {
    const wrap = pastSectionRef.current;
    if (!wrap || !hasPast) return;
    const selectedInPast =
      selectedDate && pastFilledAsc.some((d) => d.dateStr === selectedDate);
    if (selectedInPast) {
      const target = wrap.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'auto' });
        return;
      }
    }
    wrap.scrollTop = wrap.scrollHeight;
  }, [hasPast, pastFilledAsc, selectedDate]);

  return (
    <div className={s.shell}>
      <div className={s.ambient} aria-hidden />
      <div className={s.pastSection} ref={pastSectionRef}>
        {hasPast && <div className={s.sectionTitle}>Дни с активностью</div>}
        {pastGroups.map((g) => (
          <div key={g.key} className={s.monthGroup}>
            <div className={s.monthHeader}>{g.label}</div>
            <div className={s.chipRow}>
              {g.items.map((d) => (
                <DayChip
                  key={d.dateStr}
                  day={d}
                  today={today}
                  isSelected={selectedDate === d.dateStr}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {hasPast && <div className={s.divider} aria-hidden />}
      <div className={s.anchorList}>
        {anchors.map((d) => (
          <DayRow
            key={d.dateStr}
            day={d}
            today={today}
            isFilled={filledSet.has(d.dateStr)}
            isSelected={selectedDate === d.dateStr}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ScheduleNavigator;

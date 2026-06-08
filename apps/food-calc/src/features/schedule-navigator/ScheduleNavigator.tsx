import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { addDays, differenceInCalendarDays, format, isSameDay, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { deriveFilledDates, useFilledDateKeys, useToday } from './hooks';
import { computePastFilledAsc, DATE_FORMAT, groupByMonth, parseKeys, type ParsedDay } from './lib';
import type { DateStr } from './model';
import s from './ScheduleNavigator.module.scss';

interface Props {
  onSelect: (date: DateStr) => void;
  selectedDate?: DateStr;
}

// Stable controlled-value arrays for the past-days accordion — single item
// keyed "past". Hoisted so the Root prop identity is stable across renders.
const PAST_OPEN = ['past'];
const PAST_CLOSED: string[] = [];

// ─── DayRow (anchors — full-width, three of them) ──────────────────────────
interface DayRowProps {
  day: ParsedDay;
  today: Date;
  isFilled: boolean;
  isSelected: boolean;
  onSelect: (dateStr: DateStr) => void;
}

const DayRow = memo(function DayRow({ day, today, isFilled, isSelected, onSelect }: DayRowProps) {
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
    <button type="button" className={className} onClick={handleClick} data-date={day.dateStr}>
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

const DayChip = memo(function DayChip({ day, today, isSelected, onSelect }: DayChipProps) {
  const handleClick = useCallback(() => onSelect(day.dateStr), [day.dateStr, onSelect]);
  const isToday = isSameDay(day.date, today);
  const dayNumber = format(day.date, 'd');
  // 'EEEEEE' = short standalone in ru locale ("пн", "вт", ...). Compact and
  // unambiguous unlike narrow 1-char form.
  const weekdayShort = format(day.date, 'EEEEEE', { locale: ru });

  const className = [s.dayChip, isToday && s.dayChipToday, isSelected && s.dayChipSelected]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={className} onClick={handleClick} data-date={day.dateStr}>
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

  const pastFilledAsc = useMemo(() => computePastFilledAsc(filledAsc, today), [filledAsc, today]);
  const pastGroups = useMemo(() => groupByMonth(pastFilledAsc), [pastFilledAsc]);

  const yesterday = useMemo(() => subDays(today, 1), [today]);
  const anchors: ParsedDay[] = useMemo(
    () => [
      { date: yesterday, dateStr: yesterdayStr },
      { date: today, dateStr: todayStr },
      { date: addDays(today, 1), dateStr: tomorrowStr },
    ],
    [yesterday, yesterdayStr, today, todayStr, tomorrowStr]
  );

  const handleSelect = useCallback((dateStr: DateStr) => onSelect(dateStr), [onSelect]);

  // After hydration: if selectedDate is inside the past chips, centre it; else
  // pin scroll to the bottom so the newest past day sits flush against the
  // anchor block. Without this branch a far-in-past selectedDate would be
  // silently invisible if it scrolled outside the visible area.
  const pastSectionRef = useRef<HTMLDivElement>(null);
  const hasPast = pastFilledAsc.length > 0;

  // Past days hide behind a «Показать прошлые дни» accordion — the drawer stays
  // compact (just the yesterday/today/tomorrow anchors) until the user opens it.
  // The accordion ALWAYS starts closed, even when the selected day lives in the
  // past — the compact view is the deliberate default; opening it is an explicit
  // tap. `selectedInPast` still feeds the scroll-into-view below so that, once
  // the user opens the accordion, a past selection is centred rather than left
  // off-screen.
  const [openPast, setOpenPast] = useState(false);
  const selectedInPast = !!selectedDate && pastFilledAsc.some((d) => d.dateStr === selectedDate);

  // Directional fade hints: fade the top edge only when content is scrolled
  // above the fold, fade the bottom edge only when there's more below. A
  // static top-only mask (the previous approach) hid the "more below" signal
  // whenever you scrolled up to the oldest dates.
  const [fades, setFades] = useState({ top: false, bottom: false });
  const updateFades = useCallback(() => {
    const wrap = pastSectionRef.current;
    if (!wrap) return;
    const { scrollTop, scrollHeight, clientHeight } = wrap;
    const top = scrollTop > 1;
    const bottom = scrollTop + clientHeight < scrollHeight - 1;
    setFades((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, []);

  useLayoutEffect(() => {
    // The panel is unmounted while collapsed (ref is null), so this only runs
    // once the accordion is open and the chips are in the DOM.
    const wrap = pastSectionRef.current;
    if (!wrap || !hasPast || !openPast) return;
    if (selectedInPast) {
      const target = wrap.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'auto' });
        updateFades();
        return;
      }
    }
    wrap.scrollTop = wrap.scrollHeight;
    updateFades();
  }, [hasPast, openPast, pastFilledAsc, selectedDate, selectedInPast, updateFades]);

  return (
    <div className={s.shell}>
      <div className={s.ambient} aria-hidden />
      {hasPast && (
        <Accordion.Root
          className={s.accordion}
          value={openPast ? PAST_OPEN : PAST_CLOSED}
          onValueChange={(value) => setOpenPast(value.length > 0)}
        >
          <Accordion.Item value="past" className={s.accordionItem}>
            <Accordion.Header className={s.accordionHeader}>
              <Accordion.Trigger className={s.accordionTrigger}>
                <span>Показать прошлые дни</span>
                <svg
                  className={s.accordionChevron}
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  aria-hidden
                >
                  <path
                    d="M4 6l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className={s.accordionPanel}>
              <div
                className={s.pastSection}
                ref={pastSectionRef}
                onScroll={updateFades}
                data-fade-top={fades.top || undefined}
                data-fade-bottom={fades.bottom || undefined}
              >
                {pastGroups.map((g) => (
                  // Month name is the first inline item of the chip row — chips
                  // have no backing, so it shows through the wrap flow without
                  // claiming a column.
                  <div key={g.key} className={s.chipRow}>
                    <span className={s.monthName}>
                      <span>
                        {g.name}
                        {"'"}
                      </span>
                      <span>{g.year}</span>
                    </span>
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
                ))}
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      )}
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

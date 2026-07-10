import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, isValid, parseISO, startOfDay, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import clsx from 'clsx';
import { FieldLabel } from '@/shared/ui/atoms/Typography/FieldLabel';
import { Text } from '@/shared/ui/atoms/Typography';
import {
  MAX_RETRO_DAYS,
  MAX_WINDOW_DAYS,
  MIN_WINDOW_DAYS,
  endsInFuture,
  isValidWindow,
  toKey,
  windowSpanDays,
  type DateRange,
} from './range';
import RangeCalendar from './RangeCalendar';
import styles from './RangePickerWithFallback.module.scss';

function formatHuman(key: string): string {
  const d = parseISO(key);
  return isValid(d) ? format(d, 'd MMMM', { locale: ru }) : '';
}

const START_ID = 'long-analysis-window-start';
const END_ID = 'long-analysis-window-end';

type Endpoint = 'start' | 'end';

type Props = {
  value: DateRange;
  onChange: (next: DateRange) => void;
};

// Long-analysis window picker. Two field-triggers (Начало / Конец) toggle ONE
// inline calendar rendered inside the modal body — the native OS `<input
// type="date">` popup was dropped 2026-07-05 because its calendar is OS chrome,
// unreachable from CSS on every browser, so it could never match the app. The
// replacement is a custom range calendar built on ScheduleNavigator's grid
// (shared `calendar-grid()` mixin) — inline, not a drawer, since this picker
// lives inside a Modal and a Drawer would render behind it (z-index canon).
//
// Interaction: tapping a field opens the calendar with THAT endpoint active
// («Начало» → next tap sets the start, then flow moves to the end; «Конец» →
// next tap sets the end, then the panel collapses). Picking a day that crosses
// the other end drags it along so start ≤ end always holds. The host still
// validates the span (7..35 days, end ≤ today) before submit.
const RangePickerWithFallback = ({ value, onChange }: Props) => {
  const span = windowSpanDays(value);
  const spanKnown = Number.isFinite(span);
  const future = endsInFuture(value);

  // `active` = which endpoint the next day-tap assigns; null = calendar collapsed.
  const [active, setActive] = useState<Endpoint | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxKey = useMemo(() => toKey(today), [today]);
  // Earliest selectable day covers every valid window: end may sit up to
  // MAX_RETRO_DAYS back, spanning up to MAX_WINDOW_DAYS more.
  const minKey = useMemo(
    () => toKey(subDays(today, MAX_RETRO_DAYS + MAX_WINDOW_DAYS)),
    [today]
  );

  const toggle = useCallback(
    (which: Endpoint) => setActive((prev) => (prev === which ? null : which)),
    []
  );

  const handleSelectDay = useCallback(
    (dateStr: string) => {
      if (active === 'start') {
        const next: DateRange = { ...value, start: dateStr };
        // Тап позже конца — тянем конец за собой (start ≤ end инвариант).
        if (value.end && parseISO(dateStr) > parseISO(value.end)) next.end = dateStr;
        onChange(next);
        setActive('end'); // поток: выбрал начало → жди конец
      } else {
        const next: DateRange = { ...value, end: dateStr };
        // Тап раньше начала — тянем начало за собой.
        if (value.start && parseISO(dateStr) < parseISO(value.start)) next.start = dateStr;
        onChange(next);
        setActive(null); // конец выбран → сворачиваем
      }
    },
    [active, value, onChange]
  );

  // При раскрытии — прокрутить к «низу» (свежие месяцы / сегодня) — там окно.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [active]);

  const startLabel = formatHuman(value.start);
  const endLabel = formatHuman(value.end);

  return (
    <div className={styles.root}>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <FieldLabel htmlFor={START_ID}>Начало</FieldLabel>
          <button
            id={START_ID}
            type="button"
            aria-label="Начало"
            aria-expanded={active === 'start'}
            className={clsx(styles.trigger, active === 'start' && styles.triggerActive)}
            onClick={() => toggle('start')}
          >
            {startLabel || <span className={styles.triggerPlaceholder}>дата</span>}
          </button>
        </div>
        <div className={styles.field}>
          <FieldLabel htmlFor={END_ID}>Конец</FieldLabel>
          <button
            id={END_ID}
            type="button"
            aria-label="Конец"
            aria-expanded={active === 'end'}
            className={clsx(styles.trigger, active === 'end' && styles.triggerActive)}
            onClick={() => toggle('end')}
          >
            {endLabel || <span className={styles.triggerPlaceholder}>дата</span>}
          </button>
        </div>
      </div>

      {active && (
        <div className={styles.calendarPanel} ref={panelRef}>
          <RangeCalendar value={value} min={minKey} max={maxKey} onSelectDay={handleSelectDay} />
        </div>
      )}

      <Text
        as="p"
        role="caption"
        className={
          spanKnown && isValidWindow(value) && !future
            ? styles.summary
            : `${styles.summary} ${styles.summaryInvalid}`
        }
      >
        {spanKnown ? (
          <>
            {formatHuman(value.start)} — {formatHuman(value.end)}
            <span className={styles.summarySpan}> · {span} дней</span>
          </>
        ) : (
          'Введи даты окна'
        )}
        {spanKnown && !isValidWindow(value) && (
          <Text as="span" role="caption" className={styles.summaryHint}>
            {' '}
            — окно должно быть от {MIN_WINDOW_DAYS} до {MAX_WINDOW_DAYS} дней
          </Text>
        )}
        {spanKnown && isValidWindow(value) && future && (
          <Text as="span" role="caption" className={styles.summaryHint}>
            {' '}
            — конец не может быть в будущем
          </Text>
        )}
      </Text>
    </div>
  );
};

export default memo(RangePickerWithFallback);

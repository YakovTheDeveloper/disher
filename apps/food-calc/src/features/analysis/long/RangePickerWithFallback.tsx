import { memo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';
import 'react-day-picker/style.css';
import styles from './RangePickerWithFallback.module.scss';

// ─── Pure window helpers (unit-tested) ────────────────────────────────────

/** Span presets, in days. The window = [end − N, end]. */
export const RANGE_PRESETS = [7, 14, 21, 28, 35] as const;
export const MIN_WINDOW_DAYS = 7;
export const MAX_WINDOW_DAYS = 35;
/** How far back the end date may sit on the calendar (retro picker bound). */
export const MAX_RETRO_DAYS = 30;

/** Canonical range — `yyyy-MM-dd` strings (timezone-free, server-parseable). */
export type DateRange = { start: string; end: string };

export const toKey = (d: Date): string => format(d, 'yyyy-MM-dd');

/** Span in days between the two ends. NaN if either side is unparseable. */
export function windowSpanDays(range: DateRange): number {
  const s = parseISO(range.start);
  const e = parseISO(range.end);
  if (!isValid(s) || !isValid(e)) return NaN;
  return differenceInCalendarDays(e, s);
}

/** A range the long analysis will accept — span inside [7, 35], end ≥ start. */
export function isValidWindow(range: DateRange): boolean {
  const span = windowSpanDays(range);
  return (
    Number.isFinite(span) && span >= MIN_WINDOW_DAYS && span <= MAX_WINDOW_DAYS
  );
}

/**
 * `dd-MM-yyyy` keys for every day in [start, end] inclusive — feeds the Dexie
 * collectors (`collectFoods` / `collectEvents` key schedule rows by date).
 */
export function rangeDayKeys(range: DateRange): string[] {
  const s = parseISO(range.start);
  const e = parseISO(range.end);
  if (!isValid(s) || !isValid(e)) return [];
  const keys: string[] = [];
  for (let d = startOfDay(s); d <= e; d = addDays(d, 1)) {
    keys.push(format(d, 'dd-MM-yyyy'));
  }
  return keys;
}

/** Default range — last 14 days ending today. */
export function defaultRange(): DateRange {
  const end = startOfDay(new Date());
  return { start: toKey(subDays(end, 14)), end: toKey(end) };
}

function formatHuman(key: string): string {
  const d = parseISO(key);
  return isValid(d) ? format(d, 'd MMMM', { locale: ru }) : key;
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = {
  value: DateRange;
  onChange: (next: DateRange) => void;
};

// Long-analysis window picker. Two interchangeable surfaces:
//   - «calendar» — preset span chips + a react-day-picker for the end date
//     (the span is preserved when the end date moves);
//   - «native»  — two plain <input type="date"> for a hand-picked range.
// Either way it emits a DateRange; the host validates the span via
// isValidWindow before enabling submit.
const RangePickerWithFallback = ({ value, onChange }: Props) => {
  const [mode, setMode] = useState<'calendar' | 'native'>('calendar');

  const today = startOfDay(new Date());
  const todayKey = toKey(today);
  const span = windowSpanDays(value);
  const endDate = parseISO(value.end);

  // Calendar: tapping a preset keeps the end date, recomputes the start.
  function applyPreset(days: number) {
    const end = isValid(endDate) ? endDate : today;
    onChange({ start: toKey(subDays(end, days)), end: toKey(end) });
  }

  // Calendar: picking an end date keeps the current span (default 14).
  function pickEnd(date: Date | undefined) {
    if (!date) return;
    const keepSpan =
      Number.isFinite(span) && span >= 1 ? span : 14;
    const end = startOfDay(date);
    onChange({ start: toKey(subDays(end, keepSpan)), end: toKey(end) });
  }

  return (
    <div className={styles.root}>
      <div className={styles.modeToggle}>
        <button
          type="button"
          className={mode === 'calendar' ? styles.modeActive : styles.modeTab}
          onClick={() => setMode('calendar')}
        >
          Календарь
        </button>
        <button
          type="button"
          className={mode === 'native' ? styles.modeActive : styles.modeTab}
          onClick={() => setMode('native')}
        >
          Вручную
        </button>
      </div>

      {mode === 'calendar' ? (
        <>
          <div className={styles.presets}>
            {RANGE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={
                  span === p ? styles.presetActive : styles.preset
                }
                onClick={() => applyPreset(p)}
              >
                {p} дней
              </button>
            ))}
          </div>
          <div className={styles.calendarWrap}>
            <DayPicker
              mode="single"
              locale={ru}
              selected={isValid(endDate) ? endDate : undefined}
              onSelect={pickEnd}
              disabled={{
                before: subDays(today, MAX_RETRO_DAYS),
                after: today,
              }}
              defaultMonth={isValid(endDate) ? endDate : today}
            />
          </div>
        </>
      ) : (
        <div className={styles.nativeRow}>
          <label className={styles.nativeField}>
            <span className={styles.nativeLabel}>Начало</span>
            <input
              type="date"
              className={styles.nativeInput}
              value={value.start}
              max={value.end || todayKey}
              onChange={(e) =>
                onChange({ ...value, start: e.target.value })
              }
              data-base-ui-swipe-ignore
            />
          </label>
          <label className={styles.nativeField}>
            <span className={styles.nativeLabel}>Конец</span>
            <input
              type="date"
              className={styles.nativeInput}
              value={value.end}
              max={todayKey}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
              data-base-ui-swipe-ignore
            />
          </label>
        </div>
      )}

      <p
        className={
          isValidWindow(value)
            ? styles.summary
            : `${styles.summary} ${styles.summaryInvalid}`
        }
      >
        {Number.isFinite(span) ? (
          <>
            {formatHuman(value.start)} — {formatHuman(value.end)}
            <span className={styles.summarySpan}> · {span} дней</span>
          </>
        ) : (
          'Выбери даты окна'
        )}
        {Number.isFinite(span) && !isValidWindow(value) && (
          <span className={styles.summaryHint}>
            {' '}
            — окно должно быть от {MIN_WINDOW_DAYS} до {MAX_WINDOW_DAYS} дней
          </span>
        )}
      </p>
    </div>
  );
};

export default memo(RangePickerWithFallback);

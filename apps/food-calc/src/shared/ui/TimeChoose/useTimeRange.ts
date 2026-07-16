import { useState, useCallback } from 'react';

export type RangeTab = 'from' | 'to' | 'duration';

const RANGE_TAB_LABELS: Record<RangeTab, string> = {
  from: 'от',
  to: 'до',
  duration: 'длит.',
};

const RANGE_TABS: RangeTab[] = ['from', 'to', 'duration'];

/** Parse "HH:MM" → total minutes from midnight */
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** Total minutes → "HH:MM" (wraps at 24h) */
const minutesToTime = (total: number): string => {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Format duration minutes as "HH:MM" (can exceed 24h) */
const minutesToDuration = (mins: number): string => {
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export type TimeRangeState = {
  from: string;
  to: string;
  duration: string;
  /** true when the event has an end (интервал включён) */
  toExplicitlySet: boolean;
};

export type UseTimeRangeParams = {
  initialFrom: string;
  initialTo?: string;
  onChangeRange?: (range: TimeRangeState) => void;
};

const isValidHHMM = (t: string | undefined | null): t is string =>
  typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t);

export const useTimeRange = ({ initialFrom, initialTo, onChangeRange }: UseTimeRangeParams) => {
  // Какое из полей правит герой-циферблат. `to` и `duration` — два способа ввести
  // ОДИН конец (абсолютное время vs длительность), не отдельные состояния события:
  // данные хранят только endTime.
  const [activeTab, setActiveTab] = useState<RangeTab>('from');
  // Есть ли у события конец вообще. Точечное событие (90% случаев) — интервал выкл,
  // никакого от/до-хрома. Включается опт-ином (чекбокс «Задать конец»).
  const [intervalOn, setIntervalOn] = useState(() => isValidHHMM(initialTo));
  const [fromTime, setFromTime] = useState(initialFrom);
  const [toTime, setToTime] = useState(() => (isValidHHMM(initialTo) ? initialTo : initialFrom));

  const toExplicit = intervalOn;

  const durationMinutes = (() => {
    const diff = timeToMinutes(toTime) - timeToMinutes(fromTime);
    return diff < 0 ? diff + 1440 : diff;
  })();

  const durationTime = minutesToDuration(durationMinutes);

  const notify = useCallback(
    (from: string, to: string, explicit: boolean) => {
      const diff = timeToMinutes(to) - timeToMinutes(from);
      const dur = diff < 0 ? diff + 1440 : diff;
      onChangeRange?.({ from, to, duration: minutesToDuration(dur), toExplicitlySet: explicit });
    },
    [onChangeRange],
  );

  const handleFromFinish = useCallback(
    (time: string) => {
      setFromTime(time);
      // Recalculate: keep duration, shift "to"
      const newTo = minutesToTime(timeToMinutes(time) + durationMinutes);
      setToTime(newTo);
      notify(time, newTo, intervalOn);
    },
    [durationMinutes, notify, intervalOn],
  );

  const handleToFinish = useCallback(
    (time: string) => {
      setToTime(time);
      notify(fromTime, time, true);
    },
    [fromTime, notify],
  );

  const handleDurationFinish = useCallback(
    (durString: string) => {
      // durString is "HH:MM" treated as duration
      const durMins = timeToMinutes(durString);
      const newTo = minutesToTime(timeToMinutes(fromTime) + durMins);
      setToTime(newTo);
      notify(fromTime, newTo, true);
    },
    [fromTime, notify],
  );

  /**
   * Вкл/выкл интервала (чекбокс «Задать конец»). Вкл → редактируем конец («до»);
   * выкл → событие только со стартом (endTime очищается). Возвращает вкладку, на
   * которую переведено редактирование, — вызывающий синхронизирует дисплей.
   */
  const setInterval = useCallback(
    (on: boolean): RangeTab => {
      setIntervalOn(on);
      if (on) {
        setActiveTab('to');
        notify(fromTime, toTime, true);
        return 'to';
      }
      setActiveTab('from');
      notify(fromTime, toTime, false);
      return 'from';
    },
    [fromTime, toTime, notify],
  );

  /** Выбор поля, которое правит циферблат (от / до / длит). */
  const selectField = useCallback((tab: RangeTab): RangeTab => {
    setActiveTab(tab);
    return tab;
  }, []);

  /** What onFinish + initialTime the inner TimeChoose should use for the active tab */
  const currentTimeProps = (() => {
    switch (activeTab) {
      case 'from':
        return { initialTime: fromTime, onFinish: handleFromFinish };
      case 'to':
        return { initialTime: toTime, onFinish: handleToFinish };
      case 'duration':
        return { initialTime: durationTime, onFinish: handleDurationFinish };
    }
  })();

  return {
    activeTab,
    intervalOn,
    setInterval,
    selectField,
    fromTime,
    toTime,
    durationTime,
    durationMinutes,
    toExplicit,
    currentTimeProps,
    tabs: RANGE_TABS,
    tabLabels: RANGE_TAB_LABELS,
  };
};

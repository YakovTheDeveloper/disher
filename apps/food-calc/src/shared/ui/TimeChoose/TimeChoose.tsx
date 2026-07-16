import { useState } from 'react';
import styles from './TimeChoose.module.scss';
import clsx from 'clsx';
import LabeledCheckbox from '@/shared/ui/LabeledCheckbox/LabeledCheckbox';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { Text } from '@/shared/ui/atoms/Typography';
import { TimeNow } from './TimeNow';
import { useTimeRange, type RangeTab, type TimeRangeState } from './useTimeRange';
import TimeInput, { type TimePickerVariant } from './TimeInput';

type RangeProps = {
  initialFrom: string;
  initialTo?: string;
  onChangeRange?: (range: TimeRangeState) => void;
};

type Props = {
  onFinish: (timeString: string) => void; // "HH:MM" format
  initialTime: string; // "HH:MM" format, default "00:00"
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  id?: string;
  inputId?: string;
  timePickerVariant?: TimePickerVariant;
  range?: RangeProps;
  /**
   * Не снимать фокус на завершении ввода минут — клавиатура остаётся открытой,
   * кнопка «Далее» не прыгает. Следующая цифра перепечатывает минуты. Включено
   * в step-флоу добавления еды и событий; default — обычный auto-blur.
   */
  keepKeyboardOnFinish?: boolean;
};

const formatDurationLabel = (mins: number): string => {
  if (!Number.isFinite(mins) || mins <= 0) return '0 мин';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
};

const TimeChoose = ({
  onFinish,
  initialTime,
  hourAriaLabel = 'Hour',
  minuteAriaLabel = 'Minute',
  id,
  inputId,
  timePickerVariant: controlledVariant,
  range,
  keepKeyboardOnFinish = false,
}: Props) => {
  const [localVariant, setLocalVariant] = useState<TimePickerVariant>('manual');
  const variant = controlledVariant ?? localVariant;

  const [hours, setHours] = useState<string>(initialTime.split(':')[0]);
  const [minutes, setMinutes] = useState<string>(initialTime.split(':')[1]);

  const isNative = variant === 'native';

  const timeRange = useTimeRange({
    initialFrom: range?.initialFrom ?? initialTime,
    initialTo: range?.initialTo,
    onChangeRange: range?.onChangeRange,
  });
  const isRange = !!range;

  // TimeChoose монтируется ОДИН раз: в степпер-флоу он живёт внутри ModalByLabel,
  // который всегда в DOM (раскрывается/схлопывается по CSS, без mount/unmount).
  // Поэтому useState-инициализатор отрабатывает единожды, и без этой синхронизации
  // дисплей "залипает" на времени прошлой сессии, пока родительский draft.time
  // уже сброшен на "сейчас" — пользователь видит 16:00, а «Далее» коммитит 14:24
  // (время попадает в draft только через onFinish, а при нетронутом поле он молчит).
  // Источник правды — initialTime. Правим стейт ВО ВРЕМЯ рендера (а не в useEffect):
  // React перерисует до пейнта и до детей, поэтому кадра со старым временем не
  // существует — иначе он красится и перезаписывается под кареткой на фокусе
  // (react.dev «You Might Not Need an Effect»). В range-режиме своё per-tab
  // состояние (rangeHours/rangeMinutes), его не трогаем.
  const [prevInitialTime, setPrevInitialTime] = useState(initialTime);
  if (!isRange && initialTime !== prevInitialTime) {
    setPrevInitialTime(initialTime);
    const [h, m] = initialTime.split(':');
    setHours(h);
    setMinutes(m);
  }

  // In range mode, the inner time input is driven by the active tab
  const effectiveOnFinish = isRange ? timeRange.currentTimeProps.onFinish : onFinish;
  const effectiveInitialTime = isRange ? timeRange.currentTimeProps.initialTime : initialTime;

  // Range mode needs its own hours/minutes state per tab switch
  const [rangeHours, setRangeHours] = useState<string>(effectiveInitialTime.split(':')[0]);
  const [rangeMinutes, setRangeMinutes] = useState<string>(effectiveInitialTime.split(':')[1]);

  const timeForTab = (tab: RangeTab): string =>
    tab === 'from'
      ? timeRange.fromTime
      : tab === 'to'
        ? timeRange.toTime
        : timeRange.durationTime;

  // Действия над интервалом возвращают вкладку, на которую переведено редактирование, —
  // синхронизируем по ней дисплей герой-циферблата.
  const syncDisplay = (tab: RangeTab) => {
    const t = timeForTab(tab);
    setRangeHours(t.split(':')[0]);
    setRangeMinutes(t.split(':')[1]);
  };

  const handleFieldSelect = (tab: RangeTab) => syncDisplay(timeRange.selectField(tab));
  const handleIntervalToggle = (on: boolean) => syncDisplay(timeRange.setInterval(on));

  // Таб «до» подсвечен и когда правим абсолютный конец ('to'), и когда правим его
  // как длительность ('duration') — оба редактируют один конец.
  const secondFieldActive = timeRange.activeTab !== 'from';
  const isDurationActive = timeRange.activeTab === 'duration';

  const activeHours = isRange ? rangeHours : hours;
  const activeMinutes = isRange ? rangeMinutes : minutes;
  const activeSetHours = isRange ? setRangeHours : setHours;
  const activeSetMinutes = isRange ? setRangeMinutes : setMinutes;

  const onNowSelect = (time: string) => {
    const [nowHours, nowMinutes] = time.split(':');
    activeSetHours(nowHours);
    activeSetMinutes(nowMinutes);
    effectiveOnFinish(`${nowHours}:${nowMinutes}`);
  };

  return (
    <div className={styles.shell}>
      <div
        id={id}
        className={clsx(styles.container, 'tc-root')}
        role="group"
        aria-label="Time input"
      >
        {isRange && timeRange.intervalOn && (
          <ChoiceGroup
            className={styles.rangeTabs}
            variant="segmented"
            aria-label="Что редактируем"
            value={secondFieldActive ? 'to' : 'from'}
            onChange={(v) => handleFieldSelect(v as RangeTab)}
          >
            <ChoiceItem value="from" className={styles.rangeTab}>
              {timeRange.tabLabels.from}
            </ChoiceItem>
            <ChoiceItem value="to" className={styles.rangeTab}>
              {timeRange.tabLabels.to}
            </ChoiceItem>
          </ChoiceGroup>
        )}

        <TimeInput
          variant={isNative ? 'native' : 'manual'}
          hours={activeHours}
          minutes={activeMinutes}
          setHours={activeSetHours}
          setMinutes={activeSetMinutes}
          onFinish={effectiveOnFinish}
          hourAriaLabel={hourAriaLabel}
          minuteAriaLabel={minuteAriaLabel}
          inputId={inputId}
          keepKeyboardOnFinish={keepKeyboardOnFinish}
        />

        {isRange && timeRange.intervalOn && (
          <div className={styles.rangeSummary} aria-live="polite">
            <Text as="span" role="caption" className={styles.rangeSummaryText}>
              от {timeRange.fromTime} · до {timeRange.toTime}
            </Text>
            {/* Длительность — и readout, и вход: тап переводит циферблат в ввод
                длительности (тот же конец, другое представление). */}
            <button
              type="button"
              className={clsx(styles.durationChip, isDurationActive && styles.durationChipActive)}
              aria-pressed={isDurationActive}
              onClick={() => handleFieldSelect('duration')}
            >
              {formatDurationLabel(timeRange.durationMinutes)}
            </button>
          </div>
        )}

        {isRange && (
          <LabeledCheckbox
            checked={timeRange.intervalOn}
            onChange={handleIntervalToggle}
            label="Задать конец"
          />
        )}

        <div className={styles.buttonsWrapper}>
          <TimeNow onFinish={onNowSelect} time={`${activeHours}:${activeMinutes}`}>
            <button className={clsx(styles.toggleButton, styles.nowButton)}>Сейчас</button>
          </TimeNow>

          <button
            className={clsx(styles.toggleButton, styles.swapButton)}
            onClick={() => {
              setLocalVariant((prev) => (prev === 'native' ? 'manual' : 'native'));
            }}
          >
            {isNative ? 'Ручной ввод' : 'Другой вид'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeChoose;

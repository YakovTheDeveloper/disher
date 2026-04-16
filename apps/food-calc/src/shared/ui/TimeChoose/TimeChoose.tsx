import { useState } from 'react';
import styles from './TimeChoose.module.scss';
import { useTimeChooseV2 } from './useTimeChooseV2';
import clsx from 'clsx';
import { TimeNow } from './TimeNow';
import { useTimeRange, type RangeTab, type TimeRangeState } from './useTimeRange';

type TimePickerVariant = 'native' | 'manual';

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
};

/** Single time input (manual or native) — extracted for reuse in range mode */
const TimeInput = ({
  variant,
  hours,
  minutes,
  setHours,
  setMinutes,
  onFinish,
  hourAriaLabel,
  minuteAriaLabel,
  inputId,
  normalizeTime,
}: {
  variant: TimePickerVariant;
  hours: string;
  minutes: string;
  setHours: (v: string) => void;
  setMinutes: (v: string) => void;
  onFinish: (v: string) => void;
  hourAriaLabel: string;
  minuteAriaLabel: string;
  inputId?: string;
  normalizeTime: (h: string, m: string) => string;
}) => {
  const {
    hhRef,
    mmRef,
    handleHoursChange,
    handleMinutesChange,
    handleHoursKeyDown,
    handleMinutesKeyDown,
    handleHoursBlur,
    handleMinutesBlur,
  } = useTimeChooseV2({ hours, minutes, setHours, setMinutes, onFinish });

  const handleNativeTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const [h, m] = value.split(':');
      setHours(h);
      setMinutes(m);
      onFinish(value);
    }
  };

  if (variant === 'native') {
    return (
      <div className={styles.wrapper}>
        <input
          type="time"
          className={styles.nativeInput}
          value={normalizeTime(hours, minutes)}
          onChange={handleNativeTimeChange}
          onBlur={() => onFinish(normalizeTime(hours, minutes))}
          aria-label={hourAriaLabel}
        />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.inputWrapper}>
        <input
          id={inputId}
          ref={hhRef}
          className={styles.input}
          aria-label={hourAriaLabel}
          placeholder="hh"
          inputMode="numeric"
          pattern="[0-9]*"
          value={hours}
          onChange={handleHoursChange}
          onKeyDown={handleHoursKeyDown}
          onBlur={handleHoursBlur}
          maxLength={2}
          onFocus={(e) => e.currentTarget.select()}
        />
      </label>

      <span className={styles.separator} aria-hidden="true">
        :
      </span>

      <label className={styles.inputWrapper}>
        <input
          ref={mmRef}
          className={styles.input}
          aria-label={minuteAriaLabel}
          placeholder="mm"
          inputMode="numeric"
          pattern="[0-9]*"
          value={minutes}
          onChange={handleMinutesChange}
          onKeyDown={handleMinutesKeyDown}
          onBlur={handleMinutesBlur}
          maxLength={2}
          onFocus={(e) => e.currentTarget.select()}
        />
      </label>
    </div>
  );
};

const RangeTabs = ({
  activeTab,
  onTabChange,
  tabs,
  tabLabels,
}: {
  activeTab: RangeTab;
  onTabChange: (tab: RangeTab) => void;
  tabs: RangeTab[];
  tabLabels: Record<RangeTab, string>;
}) => (
  <div className={styles.rangeTabs} role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab}
        role="tab"
        aria-selected={activeTab === tab}
        className={clsx(styles.rangeTab, activeTab === tab && styles.rangeTabActive)}
        onClick={() => onTabChange(tab)}
      >
        {tabLabels[tab]}
      </button>
    ))}
  </div>
);

const TimeChoose = ({
  onFinish,
  initialTime,
  hourAriaLabel = 'Hour',
  minuteAriaLabel = 'Minute',
  id,
  inputId,
  timePickerVariant: controlledVariant,
  range,
}: Props) => {
  const [localVariant, setLocalVariant] = useState<TimePickerVariant>('manual');
  const variant = controlledVariant ?? localVariant;
  const [hours, setHours] = useState<string>(initialTime.split(':')[0]);
  const [minutes, setMinutes] = useState<string>(initialTime.split(':')[1]);

  const isNative = variant === 'native';

  const normalizeTime = (h: string, m: string) => {
    const hNum = h === '' ? 0 : Math.max(0, Math.min(23, Number(h)));
    const mNum = m === '' ? 0 : Math.max(0, Math.min(59, Number(m)));
    return `${String(hNum).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`;
  };

  const timeRange = useTimeRange({
    initialFrom: range?.initialFrom ?? initialTime,
    initialTo: range?.initialTo,
    onChangeRange: range?.onChangeRange,
  });
  const isRange = !!range;

  // In range mode, the inner time input is driven by the active tab
  const effectiveOnFinish = isRange ? timeRange.currentTimeProps.onFinish : onFinish;
  const effectiveInitialTime = isRange ? timeRange.currentTimeProps.initialTime : initialTime;

  // Range mode needs its own hours/minutes state per tab switch
  const [rangeHours, setRangeHours] = useState<string>(effectiveInitialTime.split(':')[0]);
  const [rangeMinutes, setRangeMinutes] = useState<string>(effectiveInitialTime.split(':')[1]);

  // Sync range hours/minutes when tab changes
  const handleTabChange = (tab: RangeTab) => {
    timeRange.setActiveTab(tab);
    const timeForTab =
      tab === 'from'
        ? timeRange.fromTime
        : tab === 'to'
          ? timeRange.toTime
          : timeRange.durationTime;
    setRangeHours(timeForTab.split(':')[0]);
    setRangeMinutes(timeForTab.split(':')[1]);
  };

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
    <div id={id} className={styles.container} role="group" aria-label="Time input">
      {isRange && (
        <RangeTabs
          activeTab={timeRange.activeTab}
          onTabChange={handleTabChange}
          tabs={timeRange.tabs}
          tabLabels={timeRange.tabLabels}
        />
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
        normalizeTime={normalizeTime}
      />
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
          {isNative ? 'Ручной ввод' : 'Системный'}
        </button>
      </div>
    </div>
  );
};

export default TimeChoose;

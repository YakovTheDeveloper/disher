// TimePicker.tsx
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './TimePicker.module.scss';
import clsx from 'clsx';
import { useTimePicker } from './useTimePicker';

type Props = {
  value?: string; // "HH:MM" initial value
  onChange?: (value: string) => void; // on every normalized change
  onFinish?: (value: string) => void; // after minutes completed (and blurred)
  id?: string;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  hours: string; // "HH" initial value
  minutes: string; // "MM" initial value
  setHours: (value: string) => void;
  setMinutes: (value: string) => void;
  autoFocus?: boolean;
};

const TimePicker = observer((props: Props) => {
  const {
    hours,
    minutes,
    setHours,
    setMinutes,
    onChange,
    onFinish,
    id,
    hourAriaLabel = 'Hour',
    minuteAriaLabel = 'Minute',
    autoFocus,
  } = props;

  const [focusedInput, setFocusedInput] = useState<'hours' | 'minutes' | null>(null);

  const {
    hhRef,
    mmRef,
    containerRef,
    handleHoursChange,
    handleMinutesChange,
    handleHoursKeyDown,
    handleMinutesKeyDown,
    handleHoursBlur,
    handleMinutesBlur,
    incrementHours,
    decrementHours,
    incrementMinutes,
    decrementMinutes,
  } = useTimePicker({ hours, minutes, setHours, setMinutes, onChange, onFinish });

  React.useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        hhRef.current?.focus();
        hhRef.current?.select();
      }, 0);
    }
  }, [autoFocus]);

  return (
    <div
      id={id}
      className={clsx([styles.container])}
      role="group"
      aria-label="Time input"
      // keep cursor text when hover
      style={{ cursor: 'text', display: 'inline-flex', alignItems: 'center' }}
    >
      <div className={styles.inner}>
        <div className={styles.controls}>
          <button onClick={incrementHours}>↑</button>
          <button onClick={decrementHours}>↓</button>
        </div>
        <div className={styles.timeInputs} ref={containerRef}>
          <div className={styles.inputWrapper}>
            <input
              ref={hhRef}
              className={clsx(styles.input, { [styles.blinking]: focusedInput === 'hours' })}
              aria-label={hourAriaLabel}
              placeholder="hh"
              inputMode="numeric"
              pattern="[0-9]*"
              value={hours}
              onChange={handleHoursChange}
              onKeyDown={handleHoursKeyDown}
              onBlur={(e) => {
                handleHoursBlur(e);
                setFocusedInput(null);
              }}
              maxLength={2}
              // select on focus to make overwriting fast
              onFocus={(e) => {
                e.currentTarget.select();
                setFocusedInput('hours');
              }}
            />
          </div>
          <span className={styles.betweenInputs} aria-hidden>
            :
          </span>
          <div className={styles.inputWrapper}>
            <input
              ref={mmRef}
              className={clsx(styles.input, { [styles.blinking]: focusedInput === 'minutes' })}
              aria-label={minuteAriaLabel}
              placeholder="mm"
              inputMode="numeric"
              pattern="[0-9]*"
              value={minutes}
              onChange={handleMinutesChange}
              onKeyDown={handleMinutesKeyDown}
              onBlur={(e) => {
                handleMinutesBlur(e);
                setFocusedInput(null);
              }}
              maxLength={2}
              onFocus={(e) => {
                e.currentTarget.select();
                setFocusedInput('minutes');
              }}
            />
          </div>
        </div>
        <div className={styles.controls}>
          <button onClick={incrementMinutes}>↑</button>
          <button onClick={decrementMinutes}>↓</button>
        </div>
      </div>
    </div>
  );
});

export default TimePicker;

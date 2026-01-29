// TimePicker.tsx
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './TimePicker.module.scss';
import clsx from 'clsx';
import { useTimePicker } from './useTimePicker';
import { useIOSAutofocus } from '@/hooks/useIOSAutofocus';

import ArrowIcon from '@/assets/icons/arrows/curve-arrow.svg';
import { emitter } from '@/infrastructure/emitter/emitter';
import { domainStore } from '@/store/store';

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

  const isIOS = domainStore.globalUiStore.userAgentStore.isIOS;

  // Use iOS autofocus hack
  // useIOSAutofocus(hhRef, autoFocus);

  React.useEffect(() => {
    if (autoFocus && !isIOS) {
      const timeoutId = setTimeout(() => {
        hhRef.current?.focus();
        hhRef.current?.select();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [autoFocus, isIOS]);

  React.useEffect(() => {
    const handler = () => hhRef.current?.focus();
    emitter.on('WIZARD_FOCUS', handler);
    return () => emitter.off('WIZARD_FOCUS', handler);
  }, []);

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
          <button onClick={incrementHours} className={styles.rotateUp}>
            <ArrowIcon />
          </button>
          <button onClick={decrementHours} className={styles.rotateDown}>
            <ArrowIcon />
          </button>
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
          <button onClick={incrementMinutes} className={styles.rotateUpLeft}>
            <ArrowIcon />
          </button>
          <button onClick={decrementMinutes} className={styles.rotateDownRight}>
            <ArrowIcon />
          </button>
        </div>
      </div>
    </div>
  );
});

export default TimePicker;

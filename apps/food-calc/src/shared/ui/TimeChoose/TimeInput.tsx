import styles from './TimeChoose.module.scss';
import { useTimeChoose } from './useTimeChoose';
import { normalizeTime } from './time-utils';

export type TimePickerVariant = 'native' | 'manual';

type TimeInputProps = {
  variant: TimePickerVariant;
  hours: string;
  minutes: string;
  setHours: (v: string) => void;
  setMinutes: (v: string) => void;
  onFinish: (v: string) => void;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  inputId?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
};

/** Single time input (manual or native) — extracted for reuse outside TimeChoose. */
const TimeInput = ({
  variant,
  hours,
  minutes,
  setHours,
  setMinutes,
  onFinish,
  hourAriaLabel = 'Hour',
  minuteAriaLabel = 'Minute',
  inputId,
  autoFocus = false,
  onBlur,
}: TimeInputProps) => {
  const {
    hhRef,
    mmRef,
    handleHoursChange,
    handleMinutesChange,
    handleHoursKeyDown,
    handleMinutesKeyDown,
    handleHoursBlur,
    handleMinutesBlur,
  } = useTimeChoose({ hours, minutes, setHours, setMinutes, onFinish });

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
          id={inputId}
          type="time"
          className={styles.nativeInput}
          value={normalizeTime(hours, minutes)}
          onChange={handleNativeTimeChange}
          onBlur={() => {
            onFinish(normalizeTime(hours, minutes));
            onBlur?.();
          }}
          aria-label={hourAriaLabel}
          autoFocus={autoFocus}
        />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.inputWrapper}>
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
          onBlur={() => {
            handleHoursBlur();
            onBlur?.();
          }}
          maxLength={2}
          autoFocus={autoFocus}
          onFocus={(e) => e.currentTarget.select()}
        />
      </span>

      <span className={styles.separator} aria-hidden="true">
        :
      </span>

      <span className={styles.inputWrapper}>
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
          onBlur={() => {
            handleMinutesBlur();
            onBlur?.();
          }}
          maxLength={2}
          onFocus={(e) => e.currentTarget.select()}
        />
      </span>
    </div>
  );
};

export default TimeInput;

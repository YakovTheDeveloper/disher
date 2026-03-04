import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styles from './TimeChoose.module.scss';
import { useTimeChooseV2 } from './useTimeChooseV2';
import clsx from 'clsx';
import { TimeNow } from './TimeNow';
import { domainStore } from '@/store/store';
import { UIViewOptionsInstance } from '@/store/GlobalUiStore/UiViewOptions/UiViewOptions';

type Props = {
  onFinish: (timeString: string) => void; // "HH:MM" format
  initialTime: string; // "HH:MM" format, default "00:00"
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  id?: string;
  uiStore?: UIViewOptionsInstance;
};

const TimeChoose = observer(
  ({
    onFinish,
    initialTime,
    hourAriaLabel = 'Hour',
    minuteAriaLabel = 'Minute',
    id,
    uiStore = domainStore.globalUiStore.options,
  }: Props) => {
    const [hours, setHours] = useState<string>(initialTime.split(':')[0]);
    const [minutes, setMinutes] = useState<string>(initialTime.split(':')[1]);

    const isNative = uiStore.timePickerVariant === 'native';

    // Normalize hours and minutes to HH:MM format for native input
    const normalizeTime = (h: string, m: string) => {
      const hNum = h === '' ? 0 : Math.max(0, Math.min(23, Number(h)));
      const mNum = m === '' ? 0 : Math.max(0, Math.min(59, Number(m)));
      return `${String(hNum).padStart(2, '0')}:${String(mNum).padStart(2, '0')}`;
    };

    const handleNativeTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value; // "HH:MM" format from native input
      if (value) {
        const [h, m] = value.split(':');
        setHours(h);
        setMinutes(m);
        onFinish(value);
      }
    };

    const {
      hhRef,
      mmRef,
      handleHoursChange,
      handleMinutesChange,
      handleHoursKeyDown,
      handleMinutesKeyDown,
      handleHoursBlur,
      handleMinutesBlur,
    } = useTimeChooseV2({
      hours,
      minutes,
      setHours,
      setMinutes,
      onFinish,
    });

    const onNowSelect = (time: string) => {
      const [nowHours, nowMinutes] = time.split(':');
      setHours(nowHours);
      setMinutes(nowMinutes);
      onFinish(`${nowHours}:${nowMinutes}`);
    };

    return (
      <div
        id={id}
        className={clsx(styles.container)}
        role="group"
        aria-label="Time input"
        style={{ cursor: 'text', display: 'inline-flex', alignItems: 'center' }}
      >
        {isNative ? (
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
        ) : (
          <div className={styles.wrapper}>
            <label className={styles.inputWrapper}>
              <input
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
                onFocus={(e) => {
                  e.currentTarget.select();
                }}
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
                onFocus={(e) => {
                  e.currentTarget.select();
                }}
              />
            </label>
          </div>
        )}

        <div className={styles.buttonsWrapper}>
          <button
            className={clsx([styles.toggleButton, styles.swapButton])}
            onClick={() => {
              uiStore.toggleTimePickerVariant();
            }}
          >
            Сменить вид
          </button>

          <TimeNow onFinish={onNowSelect} time={`${hours}:${minutes}`}>
            <button className={clsx([styles.toggleButton, styles.nowButton])}>Текущее время</button>
          </TimeNow>
        </div>
      </div>
    );
  }
);

export default TimeChoose;

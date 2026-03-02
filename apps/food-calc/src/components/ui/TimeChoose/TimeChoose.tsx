import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styles from './TimeChoose.module.scss';
import { useTimeChooseV2 } from './useTimeChooseV2';
import clsx from 'clsx';
import { TimeNow } from '@/components/features/builders/shared/ContentEdit/Time/TimeNow';
import { domainStore } from '@/store/store';
import { UIViewOptionsInstance } from '@/store/GlobalUiStore/UiViewOptions/UiViewOptions';

type Props = {
  onFinish: (timeString: string) => void; // "HH:MM" format
  initialTime?: string; // "HH:MM" format, default "00:00"
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  id?: string;
  uiStore?: UIViewOptionsInstance;
};

const TimeChoose = observer(
  ({
    onFinish,
    initialTime = '00:00',
    hourAriaLabel = 'Hour',
    minuteAriaLabel = 'Minute',
    id,
    uiStore = domainStore.globalUiStore.options,
  }: Props) => {
    const [hours, setHours] = useState<string>(initialTime.split(':')[0] || '00');
    const [minutes, setMinutes] = useState<string>(initialTime.split(':')[1] || '00');

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

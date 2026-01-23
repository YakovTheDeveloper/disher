import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { getHours, getMinutes, subMinutes, addMinutes } from 'date-fns';
import styles from './TimeNow.module.scss';
import { QuickButton } from '@/components/features/builders/food/shared/atoms/QuickButtons/QuickButton';

type Props = {
  timeState: { localTime: string; handleTimeUpdate: (time: string) => void };
};

const formatTime = (date: Date): string => {
  return `${String(getHours(date)).padStart(2, '0')}:${String(getMinutes(date)).padStart(2, '0')}`;
};

const TimeNow = ({ timeState }: Props) => {
  const { handleTimeUpdate } = timeState;
  const [nowTime, setNowTime] = useState('');
  const [minus15Time, setMinus15Time] = useState('');
  const [plus15Time, setPlus15Time] = useState('');

  const timeNow = nowTime;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNowTime(formatTime(now));
      setMinus15Time(formatTime(subMinutes(now, 15)));
      setPlus15Time(formatTime(addMinutes(now, 15)));
    }, 2000); // update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const onNowSelect = () => {
    handleTimeUpdate(formatTime(new Date()));
  };

  const onMinus15Select = () => {
    handleTimeUpdate(formatTime(subMinutes(new Date(), 15)));
  };

  const onPlus15Select = () => {
    handleTimeUpdate(formatTime(addMinutes(new Date(), 15)));
  };

  return (
    <div className={styles.list}>
      <QuickButton
        className={styles.button}
        isActive={minus15Time === timeState.localTime}
        onClick={onMinus15Select}
      >
        <span className={styles.textNow}>сейчас</span>
        <span className={styles.textMinutes}>-15 мин.</span>
      </QuickButton>
      <QuickButton
        className={styles.button}
        onClick={onNowSelect}
        isActive={timeNow === timeState.localTime}
      >
        <span className={styles.textNow}>сейчас</span>
        <span className={styles.textMinutes}>{timeNow}</span>
      </QuickButton>
      <QuickButton
        className={styles.button}
        isActive={plus15Time === timeState.localTime}
        onClick={onPlus15Select}
      >
        <span className={styles.textNow}>сейчас</span>
        <span className={styles.textMinutes}>+15 мин.</span>
      </QuickButton>
    </div>
  );
};

export default observer(TimeNow);

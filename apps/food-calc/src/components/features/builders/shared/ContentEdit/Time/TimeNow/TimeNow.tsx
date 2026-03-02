import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import { getHours, getMinutes, subMinutes, addMinutes } from 'date-fns';
import styles from './TimeNow.module.scss';

type Props = {
  time: string;
  children: React.ReactNode;
  onFinish: (time: string) => void;
};

const formatTime = (date: Date): string => {
  return `${String(getHours(date)).padStart(2, '0')}:${String(getMinutes(date)).padStart(2, '0')}`;
};

const TimeNow = ({ onFinish, time, children }: Props) => {
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
    onFinish(formatTime(new Date()));
  };

  const onMinus15Select = () => {
    onFinish(formatTime(subMinutes(new Date(), 15)));
  };

  const onPlus15Select = () => {
    onFinish(formatTime(addMinutes(new Date(), 15)));
  };

  const timeMatch = timeNow === time;

  if (timeMatch) return null;

  return (
    <div className={styles.timeNow} onClick={onNowSelect}>
      {children}
      {/* <span className={styles.textMinutes}>({timeNow})</span> */}
    </div>
  );
};

export default observer(TimeNow);

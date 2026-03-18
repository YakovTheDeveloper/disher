import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { getHours, getMinutes } from 'date-fns';

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

  const timeNow = nowTime;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNowTime(formatTime(now));
    }, 2000); // update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const onNowSelect = () => {
    onFinish(formatTime(new Date()));
  };

  const timeMatch = timeNow === time;

  if (timeMatch) return null;

  return (
    <div onClick={onNowSelect}>
      {children}
      {/* <span className={styles.textMinutes}>({timeNow})</span> */}
    </div>
  );
};

export default observer(TimeNow);

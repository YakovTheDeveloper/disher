import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { getHours, getMinutes, subMinutes, addMinutes } from 'date-fns';
import styles from './TimeNow.module.scss';
import { QuickButton } from '@/components/features/builders/food/shared/atoms/QuickButtons/QuickButton';

type Props = {
  time: string;
  onTimeChange: (hours: string, minutes: string) => void;
};

const TimeNow = ({ time, onTimeChange }: Props) => {
  const [currentHours, setCurrentHours] = useState(String(getHours(new Date())).padStart(2, '0'));
  const [currentMinutes, setCurrentMinutes] = useState(
    String(getMinutes(new Date())).padStart(2, '0')
  );
  const [minus15Time, setMinus15Time] = useState('');
  const [plus15Time, setPlus15Time] = useState('');

  const timeNow = currentHours + ':' + currentMinutes;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentHours(String(getHours(now)).padStart(2, '0'));
      setCurrentMinutes(String(getMinutes(now)).padStart(2, '0'));
      const minus15 = subMinutes(now, 15);
      const plus15 = addMinutes(now, 15);
      setMinus15Time(
        String(getHours(minus15)).padStart(2, '0') +
          ':' +
          String(getMinutes(minus15)).padStart(2, '0')
      );
      setPlus15Time(
        String(getHours(plus15)).padStart(2, '0') +
          ':' +
          String(getMinutes(plus15)).padStart(2, '0')
      );
    }, 2000); // update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const onNowSelect = () => {
    const now = new Date();
    onTimeChange(String(getHours(now)).padStart(2, '0'), String(getMinutes(now)).padStart(2, '0'));
  };

  const onMinus15Select = () => {
    const minus15 = subMinutes(new Date(), 15);
    onTimeChange(
      String(getHours(minus15)).padStart(2, '0'),
      String(getMinutes(minus15)).padStart(2, '0')
    );
  };

  const onPlus15Select = () => {
    const plus15 = addMinutes(new Date(), 15);
    onTimeChange(
      String(getHours(plus15)).padStart(2, '0'),
      String(getMinutes(plus15)).padStart(2, '0')
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        <QuickButton
          className={styles.button}
          isActive={minus15Time === time}
          onClick={onMinus15Select}
        >
          <span className={styles.textNow}>сейчас</span>
          <span className={styles.textMinutes}>-15 мин.</span>
        </QuickButton>
        <QuickButton className={styles.button} onClick={onNowSelect} isActive={timeNow === time}>
          <span className={styles.textNow}>сейчас</span>
          <span className={styles.textMinutes}>{timeNow}</span>
        </QuickButton>
        <QuickButton
          className={styles.button}
          isActive={plus15Time === time}
          onClick={onPlus15Select}
        >
          <span className={styles.textNow}>сейчас</span>
          <span className={styles.textMinutes}>+15 мин.</span>
        </QuickButton>
      </div>
    </div>
  );
};

export default observer(TimeNow);

import { observer } from 'mobx-react-lite';
import style from './Time.module.scss';
import dateFns from 'date-fns';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimePicker } from '@/components/features/builders/food/ScheduleBuilder/components/TimePicker';
import { QuickButtons } from '@/components/features/builders/food/shared/atoms/QuickButtons';
import { QuickButton } from '@/components/features/builders/food/shared/atoms/QuickButtons/QuickButton';

const TIME = {
  HOURS: [
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '00',
    '01',
    '02',
    '03',
    '04',
    '05',
  ],
  MINUTES: ['00', '05', '10', '15', '20', '25'],
  MINUTES2: ['30', '35', '40', '45', '50', '55'],
};

const parseTime = (time: string) => {
  return time.split(':');
};

type HasTime = { time: string };

// type Props<T extends HasTime> = {
//   store: {
//     current: T | null;
//     updateCurrent: (fields: Partial<T>) => void;
//   };
//   onFinish: () => void;
// };

type Props = {
  item: {
    time: string;
    updateTime: (time: string) => void;
  };
  onFinish: () => void;
};

function Time({ item, onFinish }: Props) {
  const [initHours, initMinutes] = parseTime(item.time || '');
  const [minutes, setMinutes] = useState<string>(initMinutes);
  const [hours, setHours] = useState(initHours);

  const time = hours + ':' + minutes;

  const [animHour, setAnimHour] = useState<string | null>(null);
  const [circlePos, setCirclePos] = useState<{ x: number; y: number } | null>(null);

  const onFinishHandler = (time) => {
    console.log('time finish', time);
    item.updateTime(time);
    onFinish();
  };

  const onMinutesChange = (m: string) => {
    // const time = hours + ':' + m;
    console.log(m);
    setMinutes(m);

    // setTimeout(() => {
    //   item.updateTime(time);
    // });
    // onFinish();
  };

  console.log('time', time);

  // useEffect(() => {
  //   const time = hours + ':' + minutes;

  //   return () => item.updateTime(time);
  // }, [hours, minutes]);

  const onHourChange = (h: string, e: React.MouseEvent) => {
    setHours(h);
    setMinutes('');

    // get position of clicked hour button
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setCirclePos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setAnimHour(h);

    setTimeout(() => setAnimHour(null), 1200); // remove after animation
  };

  return (
    <>
      <div className={style.timePicker}>
        <TimePicker
          value={time}
          onFinish={onFinishHandler}
          hours={hours}
          minutes={minutes}
          setHours={setHours}
          setMinutes={onMinutesChange}
        />
      </div>
      <div className={style.nowButtons}>
        <p>Сейчас:</p>
        <div className={style.nowButtonsList}>
          {/* <QuickButton className={style.nowButton}>-30 мин.</QuickButton> */}
          {/* <QuickButton className={style.nowButton}>-15 мин.</QuickButton> */}
          <QuickButton className={style.nowButton}>cейчас</QuickButton>
          {/* <QuickButton className={style.nowButton}>+ 15 мин.</QuickButton> */}
          {/* <QuickButton className={style.nowButton}>+ 30 мин.</QuickButton> */}
        </div>
      </div>
      {/* <div className={style.values}>
        {TIME.HOURS.map((hour) => (
          <div className={style.valuesRow} key={hour}>
            <QuickButton isActive={hour === hours} onClick={(e) => onHourChange(hour, e)}>
              {hour}
            </QuickButton>

            {hour === hours && (
              <div className={style.minutes}>
                <div className={style.minutesInner}>
                  <QuickButtons
                    className={style.quickButtons}
                    options={TIME.MINUTES}
                    selectedValue={minutes}
                    onSelect={(value) => onMinutesChange(value)}
                  />
                  <QuickButtons
                    className={clsx([style.quickButtons, style.minutesSecondRow])}
                    options={TIME.MINUTES2}
                    selectedValue={minutes}
                    onSelect={(value) => onMinutesChange(value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div> */}

      {/* ANIMATION LAYER */}
      <AnimatePresence>
        {animHour && circlePos && (
          <>
            {/* Expanding Circle */}
            <motion.div
              key={hours}
              initial={{
                left: circlePos.x,
                top: circlePos.y,
                scale: 0,
                opacity: 0.8,
              }}
              animate={{
                left: '100%',
                top: 0,
                scale: 10,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                width: 200,
                height: 200,
                borderRadius: '50%',
                backgroundColor: 'limegreen',
                zIndex: 10,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />

            {/* Huge Hour Number */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 3, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '10rem',
                fontWeight: 'bold',
                zIndex: 20,
                pointerEvents: 'none',
              }}
            >
              {animHour}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default observer(Time);

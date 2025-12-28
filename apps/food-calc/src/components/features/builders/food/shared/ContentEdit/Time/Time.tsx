import { observer } from 'mobx-react-lite';
import style from './Time.module.scss';
import clsx from 'clsx';
import commonStyle from '../ContentEdit.module.scss';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  MINUTES: ['00', '10', '20', '30', '40', '50'],
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
  store: {
    current: { time: string } | null;
    updateTime: (time: string) => void;
  };
  onFinish: () => void;
};

function Time({ store, onFinish }: Props) {
  const [initHours, initMinutes] = parseTime(store.current?.time || '');
  const [minutes, setMinutes] = useState<string>(initMinutes);
  const [hours, setHours] = useState(initHours);

  const [animHour, setAnimHour] = useState<string | null>(null);
  const [circlePos, setCirclePos] = useState<{ x: number; y: number } | null>(null);

  const onMinutesChange = (m: string) => {
    const time = hours + ':' + m;
    setMinutes('');
    store.updateTime(time);
    onFinish();
  };

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
    <div className={clsx([style.container, commonStyle.SuggestionWrapper])}>
      {TIME.HOURS.map((h) => (
        <ul key={h} className={style.minutes}>
          <button
            onClick={(e) => onHourChange(h, e)}
            className={clsx([hours === h && style.hoursItem_active, style.hoursItem])}
          >
            {h}
          </button>
          {TIME.MINUTES.map((m) => (
            <button
              key={m}
              className={clsx([minutes === m && style.minutesItem_active, style.minutesItem])}
              hidden={h !== hours}
              onClick={() => onMinutesChange(m)}
            >
              {m}
            </button>
          ))}
        </ul>
      ))}

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
    </div>
  );
}

export default observer(Time);

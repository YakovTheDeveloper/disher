import { observer } from 'mobx-react-lite';
import style from './Time.module.scss';
import { useState } from 'react';
import { TimePicker } from '@/components/features/builders/food/ScheduleBuilder/components/TimePicker';

import { TimeNow } from './TimeNow';
import { NextButton } from '@/components/features/builders/food/shared/atoms/button/NextButton';

const parseTime = (time: string) => {
  return time.split(':');
};

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

  const onFinishHandler = (time: string) => {
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
        {/* <NextButton onClick={() => onFinishHandler(time)} /> */}
      </div>
      <TimeNow
        time={time}
        onTimeChange={(h, m) => {
          setHours(h);
          setMinutes(m);
        }}
      />
    </>
  );
}

export default observer(Time);

// <AnimatePresence>
//   {animHour && circlePos && (
//     <>
//       <motion.div
//         key={hours}
//         initial={{
//           left: circlePos.x,
//           top: circlePos.y,
//           scale: 0,
//           opacity: 0.8,
//         }}
//         animate={{
//           left: '100%',
//           top: 0,
//           scale: 10,
//           opacity: 0,
//         }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 1.2, ease: 'easeOut' }}
//         style={{
//           position: 'fixed',
//           width: 200,
//           height: 200,
//           borderRadius: '50%',
//           backgroundColor: 'limegreen',
//           zIndex: 10,
//           transform: 'translate(-50%, -50%)',
//           pointerEvents: 'none',
//         }}
//       />

//       {/* Huge Hour Number */}
//       <motion.div
//         initial={{ scale: 0.5, opacity: 0 }}
//         animate={{ scale: 3, opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 1.2, ease: 'easeOut' }}
//         style={{
//           position: 'fixed',
//           top: '50%',
//           left: '50%',
//           transform: 'translate(-50%, -50%)',
//           color: 'white',
//           fontSize: '10rem',
//           fontWeight: 'bold',
//           zIndex: 20,
//           pointerEvents: 'none',
//         }}
//       >
//         {animHour}
//       </motion.div>
//     </>
//   )}
// </AnimatePresence>;

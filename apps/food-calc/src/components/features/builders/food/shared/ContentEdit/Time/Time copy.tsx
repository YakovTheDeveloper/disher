import { observer } from 'mobx-react-lite';
import style from './Time.module.scss';
import { useState } from 'react';
import { TimePicker } from '@/components/features/builders/food/ScheduleBuilder/components/TimePicker';

import { TimeNow } from './TimeNow';

const parseTime = (time: string) => {
  return time.split(':');
};

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
    item.updateTime(time);
    onFinish();
  };

  const onMinutesChange = (m: string) => {
    // const time = hours + ':' + m;
    setMinutes(m);
  };

  return (
    <div className={style.container}>
      <div className={style.timePicker}>
        <TimeNow
          time={time}
          onTimeChange={(h, m) => {
            setHours(h);
            setMinutes(m);
          }}
        />
        <div>
          <input
            type="time"
            value={item.time}
            onChange={(e) => {
              const time = e.target.value;
              item.updateTime(time);
              // console.log(e.target.value);
            }}
          />
          <TimePicker
            value={time}
            onFinish={onFinishHandler}
            hours={hours}
            minutes={minutes}
            setHours={setHours}
            setMinutes={onMinutesChange}
          />
        </div>
        {/* <NextButton onClick={() => onFinishHandler(time)} /> */}
      </div>
    </div>
  );
}

export default observer(Time);

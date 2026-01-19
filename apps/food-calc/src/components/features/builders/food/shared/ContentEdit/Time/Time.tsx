import { observer } from 'mobx-react-lite';
import { useState, useEffect, useCallback } from 'react';
import style from './Time.module.scss';
import { TimePicker } from '@/components/features/builders/food/ScheduleBuilder/components/TimePicker';
import { TimeNow } from './TimeNow';

type Props = {
  item: {
    time: string; // Format "HH:mm"
    updateTime: (time: string) => void;
  };
  onFinish: () => void;
};

const Time = ({ item, onFinish }: Props) => {
  // 1. Single source of truth: Local state synchronized with MobX
  const [localTime, setLocalTime] = useState(item.time || '12:00');

  // Update local state if the store changes externally
  useEffect(() => {
    if (item.time) setLocalTime(item.time);
  }, [item.time]);

  const [hours, minutes] = localTime.split(':');

  // 2. Unified handler to prevent logic duplication
  const handleTimeUpdate = useCallback(
    (newTime: string) => {
      setLocalTime(newTime);
      item.updateTime(newTime);
    },
    [item]
  );

  const onFinishHandler = () => {
    item.updateTime(localTime);
    onFinish();
  };

  return (
    <div className={style.container}>
      <div className={style.timePicker}>
        {/* Visual Clock Header */}
        <TimeNow time={localTime} onTimeChange={(h, m) => handleTimeUpdate(`${h}:${m}`)} />

        <div className={style.inputWrapper}>
          {/* 
            UX Strategy: 
            The native input is invisible but covers the area for mobile users.
            The custom TimePicker handles desktop interactions.
          */}
          <input
            type="time"
            className={style.nativeInput}
            value={localTime}
            onChange={(e) => handleTimeUpdate(e.target.value)}
          />

          <TimePicker
            value={localTime}
            hours={hours}
            minutes={minutes}
            setHours={(h) => handleTimeUpdate(`${h}:${minutes}`)}
            setMinutes={(m) => handleTimeUpdate(`${hours}:${m}`)}
            onFinish={onFinishHandler}
          />
        </div>
      </div>
    </div>
  );
};

export default observer(Time);

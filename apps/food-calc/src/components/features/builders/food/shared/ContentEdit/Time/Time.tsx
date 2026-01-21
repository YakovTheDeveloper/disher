import { observer } from 'mobx-react-lite';
import { useState, useEffect, useCallback } from 'react';
import style from './Time.module.scss';
import { TimePicker } from '@/components/features/builders/food/ScheduleBuilder/components/TimePicker';
import { TimeNow } from './TimeNow';
import { domainStore } from '@/store/store';
import { UIViewOptionsInstance } from '@/store/GlobalUiStore/UiViewOptions/UIViewOptions';

type Props = {
  item: {
    time: string; // Format "HH:mm"
    updateTime: (time: string) => void;
  };
  onFinish: () => void;
  uiStore?: UIViewOptionsInstance;
};

const Time = ({ item, onFinish, uiStore = domainStore.globalUiStore.options }: Props) => {
  // 1. Single source of truth: Local state synchronized with MobX
  const [localTime, setLocalTime] = useState(item.time || '12:00');

  const { toggleTimePickerVariant } = uiStore;

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
      <header>
        <button className={style.toggleButton} onClick={toggleTimePickerVariant}>
          альтернативный выбор времени
        </button>
      </header>
      <div className={style.inputWrapper}>
        <TimeNow time={localTime} onTimeChange={(h, m) => handleTimeUpdate(`${h}:${m}`)} />

        {uiStore.timePickerVariant === 'native' ? (
          <input
            type="time"
            className={style.nativeInput}
            value={localTime}
            onChange={(e) => handleTimeUpdate(e.target.value)}
          />
        ) : (
          <TimePicker
            value={localTime}
            hours={hours}
            minutes={minutes}
            setHours={(h) => handleTimeUpdate(`${h}:${minutes}`)}
            setMinutes={(m) => handleTimeUpdate(`${hours}:${m}`)}
            onFinish={onFinishHandler}
          />
        )}
      </div>
    </div>
  );
};

export default observer(Time);

import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useEffect } from 'react';
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
  timeState: { localTime: string; handleTimeUpdate: (time: string) => void };
};

const Time = ({
  item,
  onFinish,
  uiStore = domainStore.globalUiStore.options,
  timeState,
}: Props) => {
  const state = timeState;

  const { toggleTimePickerVariant } = uiStore;

  const [hours, minutes] = state.localTime.split(':');

  const onFinishHandler = () => {
    item.updateTime(state.localTime);
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
        <div className={style.selectTime}>
          {uiStore.timePickerVariant === 'native' ? (
            <input
              type="time"
              className={style.nativeInput}
              value={state.localTime}
              onChange={(e) => state.handleTimeUpdate(e.target.value)}
            />
          ) : (
            <TimePicker
              value={state.localTime}
              hours={hours}
              minutes={minutes}
              setHours={(h) => state.handleTimeUpdate(`${h}:${minutes}`)}
              setMinutes={(m) => state.handleTimeUpdate(`${hours}:${m}`)}
              onFinish={onFinishHandler}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default observer(Time);

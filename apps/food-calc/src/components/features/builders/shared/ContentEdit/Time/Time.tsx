import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import style from './Time.module.scss';
import { TimePicker } from '@/components/features/builders/ScheduleBuilder/components/TimePicker';
import { domainStore } from '@/store/store';
import { UIViewOptionsInstance } from '@/store/GlobalUiStore/UiViewOptions/UIViewOptions';
import { TimeNow } from '@/components/features/builders/shared/ContentEdit/Time/TimeNow';

type Props = {
  onFinish: () => void;
  uiStore?: UIViewOptionsInstance;
  timeState: { localTime: string; handleTimeUpdate: (time: string) => void };
  asLongetivity: boolean;
};

const Time = ({
  onFinish,
  uiStore = domainStore.globalUiStore.options,
  timeState,
  asLongetivity = false,
}: Props) => {
  const state = timeState;

  const [hours, minutes] = state.localTime.split(':');

  const onFinishHandler = useCallback(() => onFinish(), [onFinish]);

  return (
    <div className={style.container}>
      {/* <img src="/bright.png" className={style.image} /> */}
      {!asLongetivity && (
        <button
          className={style.toggleButton}
          onClick={() => {
            uiStore.toggleTimePickerVariant();
          }}
        >
          часы
        </button>
      )}
      <div className={style.inputWrapper}>
        <div className={style.selectTime}>
          {!asLongetivity && uiStore.timePickerVariant === 'native' ? (
            <input
              type="time"
              className={style.nativeInput}
              value={state.localTime}
              onChange={(e) => state.handleTimeUpdate(e.target.value)}
              onBlur={onFinishHandler}
            />
          ) : (
            <TimePicker
              value={state.localTime}
              hours={hours}
              minutes={minutes}
              setHours={(h) => state.handleTimeUpdate(`${h}:${minutes}`)}
              setMinutes={(m) => state.handleTimeUpdate(`${hours}:${m}`)}
              onFinish={onFinishHandler}
              autoFocus={true}
            />
          )}
        </div>
      </div>
      {!asLongetivity && (
        <TimeNow timeState={timeState}>
          <button className={style.toggleButton}>сейчас</button>
        </TimeNow>
      )}
    </div>
  );
};

export default observer(Time);

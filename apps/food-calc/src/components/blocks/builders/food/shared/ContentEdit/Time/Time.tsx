import { observer } from 'mobx-react-lite';
import style from './Time.module.scss';
import clsx from 'clsx';
import commonStyle from '../ContentEdit.module.scss';

import { useState } from 'react';

const FOOD_NAME_PLACEHOLDER = 'Гречка...';

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

type Props = {
  vm: {
    current: { time: string } | null;
    updateCurrent: (data: { time?: string }) => void;
  };
  onFinish: () => void;
};

const Time = ({ vm, onFinish }: Props) => {
  const [initHours, initMinutes] = parseTime(vm.current?.time || '');

  const [minutes, setMinutes] = useState<string>(initMinutes);
  const [hours, setHours] = useState(initHours);
  // const hidden = vm.currentSuggestion !== Suggestion.Time;

  const onMinutesChange = (m: string) => {
    const time = hours + ':' + m;
    setMinutes('');
    vm.updateCurrent({ time });
    onFinish();
  };

  const onHourChange = (h: string) => {
    setHours(h);
    setMinutes('');
  };

  return (
    <div className={clsx([style.container, commonStyle.SuggestionWrapper])}>
      {TIME.HOURS.map((h) => (
        <ul key={h} className={style.minutes}>
          <button
            onClick={() => onHourChange(h)}
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
    </div>
  );
};

export default observer(Time);

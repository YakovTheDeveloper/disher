import { observer } from 'mobx-react-lite';
import {
  DayScheduleItemUI,
  ScheduleBuilderViewModel,
  Suggestion,
} from '../../model/ScheduleBuilderViewModel';
import style from './ScheduleBuilderTimeSuggestions.module.scss';
import { initProducts } from '@/store/productStore/initProducts';
import { DayScheduleItem } from '@/types/schedule';
import clsx from 'clsx';
import commonStyle from '../ScheduleBuilderSuggestions.module.scss';

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
    currentScheduleItem: ScheduleBuilderViewModel['currentScheduleItem'];
    acceptTime: ScheduleBuilderViewModel['acceptTime'];
    currentSuggestion: ScheduleBuilderViewModel['currentSuggestion'];
  };
};

const ScheduleBuilderTimeSuggestions = ({ vm }: Props) => {
  const [initHours, initMinutes] = parseTime(vm.currentScheduleItem?.time || '');

  const [minutes, setMinutes] = useState<string>(initMinutes);
  const [hours, setHours] = useState(initHours);
  // const hidden = vm.currentSuggestion !== Suggestion.Time;

  const onMinutesChange = (m: string) => {
    const time = hours + ':' + m;
    setMinutes('');
    vm.acceptTime(time);
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

export default observer(ScheduleBuilderTimeSuggestions);

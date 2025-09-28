import { observer } from 'mobx-react-lite';
import styles from './CopySchedule.module.scss';
import { ScheduleSelection } from '@/components/blocks/schedule/ScheduleSelection';
import {
  DayScheduleItemCopyPayloadUI,
  DayScheduleItemUI,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { ContentSelection } from '@/components/blocks/builders/food/ScheduleBuilder/ui/CopySchedule/ContentSelection';
import { useState } from 'react';
type Props = {
  children?: React.ReactNode;
  onFinish: (items: DayScheduleItemUI[]) => void;
};

const CopySchedule = ({ children, onFinish }: Props) => {
  const [date, setDate] = useState('');

  const onDateChoose = (date: Date) => {
    setDate(date.toISOString());
  };

  return (
    <>
      {!date ? (
        <ScheduleSelection onDate={onDateChoose} />
      ) : (
        <ContentSelection onFinish={onFinish} date={date} />
      )}
    </>
  );
};

export default observer(CopySchedule);

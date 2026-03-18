import { observer } from 'mobx-react-lite';
import './CopySchedule.module.scss';
import { ScheduleSelection } from '@/components/features/ScheduleSelection';
// TODO: migrate to Triplit — DayScheduleItemUI from ScheduleBuilderViewModel was removed
// import {
//   DayScheduleItemUI,
// } from '@/components/features/builders/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { ContentSelection } from '@/components/features/builders/ScheduleBuilder/ui/CopySchedule/ContentSelection';
import { useState } from 'react';

type DayScheduleItemUI = any;

type Props = {
  children?: React.ReactNode;
  onFinish: (items: DayScheduleItemUI[]) => void;
};

const CopySchedule = ({ onFinish }: Props) => {
  const [date, setDate] = useState('');

  const onDateChoose = (dateStr: string) => {
    setDate(dateStr);
  };

  return (
    <>
      {!date ? (
        <ScheduleSelection onSelect={onDateChoose} />
      ) : (
        <ContentSelection onFinish={onFinish} date={date} />
      )}
    </>
  );
};

export default observer(CopySchedule);

import React from 'react';
import styles from './DurationField.module.scss';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import clsx from 'clsx';
import { TimePicker } from '@/components/features/builders/ScheduleBuilder/components/TimePicker';
import { useLocalObservable } from 'mobx-react-lite';
import Time from '@/components/features/builders/ScheduleBuilder/components/List/Time/Time';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';

type Props = {
  value: string; // "HH:MM" format
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

const DurationField = ({ value, onChange, label, className }: Props) => {
  const timeState = useLocalObservable(() => ({
    localTime: value,
    handleTimeUpdate(newTime: string) {
      this.localTime = newTime;
      onChange(newTime);
    },
  }));

  const onFinish = () => {};

  return (
    <>
      {label}
      <ContentEdit.Time timeState={timeState} onFinish={onFinish} asLongetivity={true} />
    </>
  );
};

export default DurationField;

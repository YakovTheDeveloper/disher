import React from 'react';
import styles from './DurationField.module.scss';
import clsx from 'clsx';
import { useLocalObservable } from 'mobx-react-lite';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';

type Props = {
  value: string; // "HH:MM" format
  onChange: (value: string) => void;
  className?: string;
};

const DurationField = ({ value, onChange, className }: Props) => {
  const timeState = useLocalObservable(() => ({
    localTime: value,
    handleTimeUpdate(newTime: string) {
      this.localTime = newTime;
      onChange(newTime);
    },
  }));

  const onFinish = () => {};

  return (
    <div className={clsx(styles.container, className)}>
      <ContentEdit.Time timeState={timeState} onFinish={onFinish} asLongetivity={true} />
    </div>
  );
};

export default DurationField;

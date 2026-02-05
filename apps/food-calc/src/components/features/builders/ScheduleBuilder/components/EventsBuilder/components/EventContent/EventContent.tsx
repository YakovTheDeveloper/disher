import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './EventContent.module.scss';

import { Instance } from 'mobx-state-tree';
import { SleepContent } from './SleepContent';
import { MoodContent } from './MoodContent';
import { EnergyContent } from './EnergyContent';
import { NoteContent } from './NoteContent';
import { ActivityContent } from './ActivityContent';
import { DigestionContent } from './DigestionContent';
import { ScheduleEventItem } from '@/domain/schedule/scheduleEvent/ScheduleEvent.model';

type Props = {
  onFinish: () => void;
  currentEvent: Instance<typeof ScheduleEventItem>;
};

const EventContent = observer(({ currentEvent, onFinish }: Props) => {
  const value = currentEvent.value;
  const selected = currentEvent.type;

  const handleChange = (value: string) => {
    currentEvent.updateValue(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    // digestion handled separately
    if (selected === 'digestion') return;

    onFinish();
  };

  const handleDigestionSave = () => {
    onFinish();
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {selected === 'sleep' && <SleepContent value={value} onChange={handleChange} />}
        {selected === 'mood' && <MoodContent value={value} onChange={handleChange} />}
        {selected === 'energy' && <EnergyContent value={value} onChange={handleChange} />}
        {selected === 'note' && <NoteContent value={value} onChange={handleChange} />}
        {selected === 'activity' && <ActivityContent value={value} onChange={handleChange} />}
        {selected === 'digestion' && (
          <DigestionContent value={value} onChange={handleChange} onSave={handleDigestionSave} />
        )}
      </form>
    </div>
  );
});

export default EventContent;

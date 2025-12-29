import React, { useState, useEffect } from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import styles from './EventContent.module.scss';
import { DailyEventData } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel';

import { DaySchedule } from '@/domain/schedule/schedule';
import { Instance } from 'mobx-state-tree';
import { useItemIdParam } from '@/hooks/useItemIdParams';
import { TimePicker } from '@/components/features/builders/food/ScheduleBuilder/components/TimePicker';
import { VariantSelector } from './VariantSelector';
import { SleepContent } from './SleepContent';
import { MoodContent } from './MoodContent';
import { EnergyContent } from './EnergyContent';
import { NoteContent } from './NoteContent';
import { ActivityContent } from './ActivityContent';
import { DigestionContent } from './DigestionContent';

type VariantKey = 'sleep' | 'mood' | 'energy' | 'note' | 'activity' | 'digestion';

type Props = {
  selected: VariantKey;
  onSelect: (data: DailyEventData) => void;
  onFinish: () => void;
  schedule: Instance<typeof DaySchedule>;
};

const EventContent = observer(({ selected, onFinish, schedule }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const itemId = useItemIdParam();

  const current = schedule.events.getChildById(itemId);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    console.log('schedule', schedule);

    e.preventDefault();
    if (!selected) return;

    // digestion handled separately
    if (selected === 'digestion') return;

    schedule.addOrUpdateEvent(itemId, {
      type: selected,
      value: JSON.stringify(formData),
      time: '08:00',
    });

    onFinish();
  };

  const handleDigestionSave = () => {
    onFinish();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{current ? 'Редактировать' : 'Добавить событие'}</h2>
      {selected && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3 className={styles.formTitle}>{selected}</h3>

          {selected === 'sleep' && <SleepContent formData={formData} handleChange={handleChange} />}

          {selected === 'mood' && <MoodContent formData={formData} handleChange={handleChange} />}

          {selected === 'energy' && (
            <EnergyContent formData={formData} handleChange={handleChange} />
          )}

          {selected === 'note' && <NoteContent formData={formData} handleChange={handleChange} />}

          {selected === 'activity' && (
            <ActivityContent formData={formData} handleChange={handleChange} />
          )}

          {selected === 'digestion' && (
            <DigestionContent
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              onSave={handleDigestionSave}
            />
          )}
        </form>
      )}
    </div>
  );
});

export default EventContent;

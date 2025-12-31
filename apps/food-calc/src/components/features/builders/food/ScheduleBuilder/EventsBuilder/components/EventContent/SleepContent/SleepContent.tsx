import { observer } from 'mobx-react-lite';
import styles from './SleepContent.module.scss';
import ContentContainer from '../shared/ContentContainer/ContentContainer';
import { useEffect, useState } from 'react';
import { EventContentEditForm } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent/shared/EventContentEditForm';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

type FormData = {
  quality: number;
  hours: number;
  minutes: number;
};

const parseValueToForm = (value: string): FormData => {
  const defaultForm: FormData = {
    quality: 5,
    hours: 7,
    minutes: 30,
  };
  if (!value) {
    return defaultForm;
  }
  const parts = value.split('|');
  if (parts.length !== 3) {
    return defaultForm;
  }
  return {
    quality: parseInt(parts[0], 10),
    hours: parseInt(parts[1], 10),
    minutes: parseInt(parts[2], 10),
  };
};

const SleepContent = observer(({ value, onChange }: Props) => {
  const [formData, setFormData] = useState(parseValueToForm(value));

  const handleChange = (key: string, value: string) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          [key]: Number(value),
        }) as FormData
    );
  };

  useEffect(() => {
    const formToString = `${formData.quality}|${formData.hours}|${formData.minutes}`;
    onChange(formToString);
  }, [formData]);

  return (
    <EventContentEditForm
      items={[
        {
          key: 'quality',
          label: 'Качество',
          value: formData.quality,
          quickButtons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          placeholder: '0–10',
        },
        {
          key: 'hours',
          label: 'Часы',
          value: formData.hours,
          quickButtons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          placeholder: '0–10',
        },
        {
          key: 'minutes',
          label: 'Минуты',
          value: formData.minutes,
          quickButtons: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
          placeholder: '0–55',
        },
      ]}
      onChange={handleChange}
    />
  );
});

export default SleepContent;

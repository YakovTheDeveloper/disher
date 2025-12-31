import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { EventContentEditForm } from '../shared/EventContentEditForm';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

type FormData = {
  variant: string;
  hours: number;
  minutes: number;
};

const parseValueToForm = (value: string): FormData => {
  const defaultForm: FormData = {
    variant: '',
    hours: 0,
    minutes: 0,
  };
  if (!value) {
    return defaultForm;
  }
  const parts = value.split('|');
  if (parts.length !== 3) {
    return defaultForm;
  }
  return {
    variant: parts[0],
    hours: parseInt(parts[1], 10) || 0,
    minutes: parseInt(parts[2], 10) || 0,
  };
};

const ActivityContent = observer(({ value, onChange }: Props) => {
  const [formData, setFormData] = useState(parseValueToForm(value));

  const handleChange = (key: string, value: string) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          [key]: key === 'variant' ? value : Number(value),
        }) as FormData
    );
  };

  useEffect(() => {
    const formToString = `${formData.variant}|${formData.hours}|${formData.minutes}`;
    onChange(formToString);
  }, [formData]);

  return (
    <EventContentEditForm
      items={[
        {
          key: 'variant',
          label: 'Тип',
          value: formData.variant,
          quickButtons: ['Спортзал', 'Прогулка', 'Бег'],
          placeholder: 'бег',
        },
        {
          key: 'hours',
          label: 'Часы',
          value: formData.hours,
          quickButtons: [0, 1, 2, 3, 4],
          placeholder: '0–4',
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

export default ActivityContent;

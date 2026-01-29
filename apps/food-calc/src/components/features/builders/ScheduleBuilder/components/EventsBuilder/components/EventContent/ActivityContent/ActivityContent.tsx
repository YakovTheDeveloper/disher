import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { EventContentEditForm } from '../shared/EventContentEditForm';
import { domainStore } from '@/store/store';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { emitter } from '@/infrastructure/emitter/emitter';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

type FormData = {
  variant: string;
  hours: number;
  minutes: number;
  reps: number;
};

const parseValueToForm = (value: string): FormData => {
  const defaultForm: FormData = {
    variant: '',
    hours: 0,
    minutes: 0,
    reps: 0,
  };
  if (!value) {
    return defaultForm;
  }
  const parts = value.split('|');
  if (parts.length !== 4) {
    return defaultForm;
  }
  return {
    variant: parts[0],
    hours: parseInt(parts[1], 10) || 0,
    minutes: parseInt(parts[2], 10) || 0,
    reps: parseInt(parts[3], 10) || 0,
  };
};

const ActivityContent = observer(({ value, onChange }: Props) => {
  const [formData, setFormData] = useState(parseValueToForm(value));

  const openPulseModal = () => {
    domainStore.globalUiStore.modalStore.openModal(ModalType.PULSE_PHYSICAL_ACTIVITY);
  };

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
    const handleExerciseResult = (event: unknown) => {
      const reps = typeof event === 'string' ? event : String(event);
      setFormData((prev) => ({ ...prev, reps: parseInt(reps, 10) || 0 }));
    };

    emitter.on('EXERCISE_RESULT', handleExerciseResult);

    return () => {
      emitter.off('EXERCISE_RESULT', handleExerciseResult);
    };
  }, []);

  useEffect(() => {
    const formToString = `${formData.variant}|${formData.hours}|${formData.minutes}|${formData.reps}`;
    onChange(formToString);
  }, [formData]);

  return (
    <>
      <EventContentEditForm
        items={[
          {
            key: 'variant',
            label: 'Тип',
            value: formData.variant,
            quickButtons: ['Спортзал', 'Прогулка', 'Бег', 'Отжимания'],
            placeholder: 'бег',
            before:
              formData.variant === 'Отжимания' ? <div onClick={openPulseModal}>live!</div> : null,
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
          {
            key: 'reps',
            label: 'Повторения',
            value: formData.reps,
            quickButtons: [1, 5, 10, 15, 20],
            placeholder: '1-100',
          },
        ]}
        onChange={handleChange}
      />
    </>
  );
});

export default ActivityContent;

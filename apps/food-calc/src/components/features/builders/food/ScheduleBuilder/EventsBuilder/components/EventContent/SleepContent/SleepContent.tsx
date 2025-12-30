import { observer } from 'mobx-react-lite';
import styles from './SleepContent.module.scss';
import { Label } from '../shared/Label';
import SliderField from '../shared/SliderField/SliderField';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import QuickButtons from '../shared/QuickButtons/QuickButtons';
import ContentContainer from '../shared/ContentContainer/ContentContainer';
import { useEffect, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const parseValueToForm = (value: string) => {
  const defaultForm = {
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

  const handleChange = (key: string, value: number) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const formToString = `${formData.quality}|${formData.hours}|${formData.minutes}`;
    onChange(formToString);
  }, [formData]);

  return (
    <ContentContainer className={styles.sleepContent}>
      <Label>Quality (1–10)</Label>
      <SliderField
        value={(formData.quality as number) ?? 5}
        min={1}
        max={10}
        onChange={(value) => handleChange('quality', value)}
      />

      <Label>Hours</Label>
      <NumberInput
        className={styles.input}
        value={formData.hours ?? ''}
        onChange={(value) => handleChange('hours', Number(value))}
        placeholder="0–10"
      />
      <QuickButtons
        options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        selectedValue={formData.hours as number | undefined}
        onSelect={(value) => handleChange('hours', value)}
      />

      <Label>Minutes</Label>
      <NumberInput
        className={styles.input}
        value={formData.minutes ?? ''}
        onChange={(value) => handleChange('minutes', Number(value))}
        placeholder="0–55"
      />
      <QuickButtons
        options={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]}
        selectedValue={formData.minutes as number | undefined}
        onSelect={(value) => handleChange('minutes', value)}
      />
    </ContentContainer>
  );
});

export default SleepContent;

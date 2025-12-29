import { observer } from 'mobx-react-lite';
import styles from './SleepContent.module.scss';
import { Label } from '../shared/Label';
import SliderField from '../shared/SliderField/SliderField';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import QuickButtons from '../shared/QuickButtons/QuickButtons';
import ContentContainer from '../shared/ContentContainer/ContentContainer';

type Props = {
  formData: Record<string, unknown>;
  handleChange: (key: string, value: unknown) => void;
};

const SleepContent = observer(({ formData, handleChange }: Props) => {
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

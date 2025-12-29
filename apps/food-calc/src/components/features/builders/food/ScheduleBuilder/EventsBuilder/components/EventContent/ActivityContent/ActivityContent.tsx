import { observer } from 'mobx-react-lite';
import styles from './ActivityContent.module.scss';
import { Label } from '../shared/Label';
import QuickButtons from '../shared/QuickButtons/QuickButtons';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import ContentContainer from '../shared/ContentContainer/ContentContainer';

type Props = {
  formData: Record<string, unknown>;
  handleChange: (key: string, value: unknown) => void;
};

const ActivityContent = observer(({ formData, handleChange }: Props) => {
  return (
    <ContentContainer className={styles.activityContent}>
      <Label>Type</Label>
      <TextInput
        type="text"
        className={styles.input}
        placeholder="e.g. running"
        value={(formData.variant as string) ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleChange('variant', e.target.value)
        }
      />
      <QuickButtons
        options={['Спортзал', 'Прогулка', 'Бег']}
        selectedValue={formData.variant as string | undefined}
        onSelect={(value) => handleChange('variant', value)}
      />

      <Label>Hours</Label>
      <NumberInput
        className={styles.input}
        value={formData.hours ?? ''}
        onChange={(value) => handleChange('hours', Number(value))}
      />
      <QuickButtons
        options={[0, 1, 2, 3, 4]}
        selectedValue={formData.hours as number | undefined}
        onSelect={(value) => handleChange('hours', value)}
      />

      <Label>Minutes</Label>
      <NumberInput
        className={styles.input}
        value={formData.minutes ?? ''}
        onChange={(value) => handleChange('minutes', Number(value))}
      />
      <QuickButtons
        options={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]}
        selectedValue={formData.minutes as number | undefined}
        onSelect={(value) => handleChange('minutes', value)}
      />
    </ContentContainer>
  );
});

export default ActivityContent;

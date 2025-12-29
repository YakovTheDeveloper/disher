import { observer } from 'mobx-react-lite';
import styles from './MoodContent.module.scss';
import { Label } from '../shared/Label';
import SliderField from '../shared/SliderField/SliderField';
import ContentContainer from '../shared/ContentContainer/ContentContainer';

type Props = {
  formData: Record<string, unknown>;
  handleChange: (key: string, value: unknown) => void;
};

const MoodContent = observer(({ formData, handleChange }: Props) => {
  return (
    <ContentContainer className={styles.moodContent}>
      <Label>Mood (1–10)</Label>
      <SliderField
        value={(formData.value as number) ?? 5}
        min={1}
        max={10}
        onChange={(value) => handleChange('value', value)}
      />
    </ContentContainer>
  );
});

export default MoodContent;

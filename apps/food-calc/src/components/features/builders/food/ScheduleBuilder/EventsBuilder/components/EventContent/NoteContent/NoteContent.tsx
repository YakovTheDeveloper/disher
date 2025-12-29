import { observer } from 'mobx-react-lite';
import styles from './NoteContent.module.scss';
import { Label } from '../shared/Label';
import ContentContainer from '../shared/ContentContainer/ContentContainer';

type Props = {
  formData: Record<string, unknown>;
  handleChange: (key: string, value: unknown) => void;
};

const NoteContent = observer(({ formData, handleChange }: Props) => {
  return (
    <ContentContainer className={styles.noteContent}>
      <Label>Note</Label>
      <textarea
        className={styles.textarea}
        value={(formData.value as string) ?? ''}
        onChange={(e) => handleChange('value', e.target.value)}
      />
    </ContentContainer>
  );
});

export default NoteContent;

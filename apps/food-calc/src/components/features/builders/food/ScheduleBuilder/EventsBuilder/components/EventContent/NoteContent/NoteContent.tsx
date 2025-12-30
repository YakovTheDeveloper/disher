import { observer } from 'mobx-react-lite';
import styles from './NoteContent.module.scss';
import { Label } from '../shared/Label';
import ContentContainer from '../shared/ContentContainer/ContentContainer';
import { useEffect, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const parseValueToForm = (value: string) => {
  return {
    value: value || '',
  };
};

const NoteContent = observer(({ value, onChange }: Props) => {
  const [formData, setFormData] = useState(parseValueToForm(value));

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    onChange(formData.value);
  }, [formData]);

  return (
    <ContentContainer className={styles.noteContent}>
      <Label>Note</Label>
      <textarea
        className={styles.textarea}
        value={formData.value}
        onChange={(e) => handleChange('value', e.target.value)}
      />
    </ContentContainer>
  );
});

export default NoteContent;

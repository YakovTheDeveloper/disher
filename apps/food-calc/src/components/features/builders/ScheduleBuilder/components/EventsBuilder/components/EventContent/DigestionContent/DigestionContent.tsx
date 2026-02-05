import { observer } from 'mobx-react-lite';
import styles from './DigestionContent.module.scss';
import SliderField from '../shared/SliderField/SliderField';
import ContentContainer from '../shared/ContentContainer/ContentContainer';
import { useState } from 'react';

type DigestionSubKey = 'bloating' | 'stomach_pain' | 'heartburn' | 'constipation' | 'diarrhea';

type Props = {
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  handleChange: (key: string, value: unknown) => void;
  onSave: () => void;
};

const DigestionContent = observer(({ formData, setFormData, handleChange, onSave }: Props) => {
  const [selectedSub, setSelectedSub] = useState<DigestionSubKey | null>(null);

  return (
    <ContentContainer className={styles.digestionContainer}>
      {!selectedSub && (
        <div className={styles.variantList}>
          {['bloating', 'stomach_pain', 'heartburn', 'constipation', 'diarrhea'].map((key) => (
            <button
              key={key}
              className={styles.variantButton}
              onClick={() => {
                setSelectedSub(key as DigestionSubKey);
                setFormData({ value: 5 });
              }}
            >
              {key.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {selectedSub && (
        <div key="digestion-input" className={styles.digestionForm}>
          <h4 className={styles.subTitle}>{selectedSub.replace('_', ' ')}</h4>

          <SliderField
            value={(formData.value as number) ?? 5}
            min={1}
            max={10}
            onChange={(value) => handleChange('value', value)}
          />

          <button type="button" className={styles.submitButton} onClick={onSave}>
            Save
          </button>
        </div>
      )}
    </ContentContainer>
  );
});

export default DigestionContent;

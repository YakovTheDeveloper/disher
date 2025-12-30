import { observer } from 'mobx-react-lite';
import styles from './EnergyContent.module.scss';
import { Label } from '../shared/Label';
import SliderField from '../shared/SliderField/SliderField';
import ContentContainer from '../shared/ContentContainer/ContentContainer';
import { useEffect, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const parseValueToForm = (value: string) => {
  const defaultForm = {
    value: 5,
  };
  if (!value) {
    return defaultForm;
  }
  return {
    value: parseInt(value, 10) || 5,
  };
};

const EnergyContent = observer(({ value, onChange }: Props) => {
  const [formData, setFormData] = useState(parseValueToForm(value));

  const handleChange = (key: string, value: number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    onChange(formData.value.toString());
  }, [formData]);

  return (
    <ContentContainer className={styles.energyContent}>
      <Label>Energy (1–10)</Label>
      <SliderField
        value={formData.value}
        min={1}
        max={10}
        onChange={(value) => handleChange('value', value)}
      />
    </ContentContainer>
  );
});

export default EnergyContent;

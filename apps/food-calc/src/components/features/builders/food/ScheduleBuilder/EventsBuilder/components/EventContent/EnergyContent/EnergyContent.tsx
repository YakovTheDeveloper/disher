import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { EventContentEditForm } from '../shared/EventContentEditForm';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

type FormData = {
  value: number;
};

const parseValueToForm = (value: string): FormData => {
  return {
    value: parseInt(value, 10) || 5,
  };
};

const EnergyContent = observer(({ value, onChange }: Props) => {
  const [formData, setFormData] = useState(parseValueToForm(value));

  const handleChange = (key: string, value: string) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          [key]: Number(value),
        }) as FormData
    );
  };

  useEffect(() => {
    onChange(formData.value.toString());
  }, [formData]);

  return (
    <EventContentEditForm
      items={[
        {
          key: 'value',
          label: 'Энергия',
          value: formData.value,
          quickButtons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          placeholder: '1–10',
        },
      ]}
      onChange={handleChange}
    />
  );
});

export default EnergyContent;

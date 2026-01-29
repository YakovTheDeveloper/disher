import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { EventContentEditForm } from '../shared/EventContentEditForm';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

type FormData = {
  value: string;
};

const parseValueToForm = (value: string): FormData => {
  return {
    value: value || '',
  };
};

const NoteContent = observer(({ value, onChange }: Props) => {
  const [formData, setFormData] = useState(parseValueToForm(value));

  const handleChange = (key: string, value: string) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          [key]: value,
        }) as FormData
    );
  };

  useEffect(() => {
    onChange(formData.value);
  }, [formData]);

  return (
    <EventContentEditForm
      items={[
        {
          key: 'value',
          label: 'Заметка',
          value: formData.value,
          placeholder: 'Ваша заметка',
        },
      ]}
      onChange={handleChange}
    />
  );
});

export default NoteContent;

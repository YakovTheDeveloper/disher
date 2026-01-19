import { observer } from 'mobx-react-lite';
import styles from './EventContentEditForm.module.scss';
import { Label } from '../Label';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import QuickButtons from '../../../../../../shared/atoms/QuickButtons/QuickButtons';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { GrowingInput } from '@/components/ui/atoms/input/GrowingInput';
import clsx from 'clsx';

type BaseField = {
  key: string;
  label: string;
  placeholder?: string;
  before?: React.ReactNode | null;
};

export type FormFieldConfig =
  | (BaseField & {
      value: number;
      quickButtons?: number[] | null;
    })
  | (BaseField & {
      value: string;
      quickButtons?: string[] | null;
    });

type Props = {
  items: FormFieldConfig[];
  onChange: (key: string, value: string) => void;
};

const isNumberField = (
  field: FormFieldConfig
): field is BaseField & { value: number; quickButtons: number[] | null } =>
  typeof field.value === 'number';

const isStringField = (
  field: FormFieldConfig
): field is BaseField & { value: string; quickButtons: string[] | null } =>
  typeof field.value === 'string';

const EventContentEditForm = observer(({ items, onChange }: Props) => {
  const handleNumberQuickSelect = (key: string) => (value: number) => {
    onChange(key, value.toString());
  };

  const handleStringQuickSelect = (key: string) => (value: string) => {
    onChange(key, value);
  };

  return items.map((config, index) => {
    const displayValue = String(config.value);

    return (
      <div key={index}>
        <Label aside={<ScreenLabel variant="formValueLabel">{displayValue}</ScreenLabel>}>
          {config.before}
          {typeof config.value === 'number' && (
            <NumberInput
              className={clsx([styles.input, styles.inputNumber])}
              value={config.value}
              onChange={(current: number) => onChange(config.key, current.toString())}
              placeholder={config.placeholder}
            />
          )}
          {typeof config.value === 'string' && (
            <GrowingInput
              maxWidth={260}
              extraWidth={50}
              className={clsx([styles.input, styles.inputText])}
              value={config.value}
              onChange={(e) => onChange(config.key, e.target.value)}
              placeholder={config.placeholder}
            />
          )}
          {config.label}
        </Label>
        {isNumberField(config) && config.quickButtons && (
          <QuickButtons<number>
            className={styles.quickButtons}
            options={config.quickButtons}
            selectedValue={config.value}
            onSelect={handleNumberQuickSelect(config.key)}
          />
        )}

        {isStringField(config) && config.quickButtons && (
          <QuickButtons<string>
            className={styles.quickButtons}
            options={config.quickButtons}
            selectedValue={config.value}
            onSelect={handleStringQuickSelect(config.key)}
          />
        )}
      </div>
    );
  });
});

export default EventContentEditForm;

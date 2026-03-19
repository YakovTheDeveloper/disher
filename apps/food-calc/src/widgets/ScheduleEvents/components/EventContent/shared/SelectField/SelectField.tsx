import styles from './SelectField.module.scss';
import clsx from 'clsx';
import SelectableInput from '@/shared/ui/atoms/Button/SelectableInput/SelectableInput';

type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const SelectField = ({ options, value, onChange, className }: Props) => {
  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.options}>
        {options.map((option) => (
          <SelectableInput
            key={option.value}
            id={option.value}
            name="select"
            type="radio"
            isChecked={value === option.value}
            onChange={(id) => onChange(String(id))}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );
};

export default SelectField;

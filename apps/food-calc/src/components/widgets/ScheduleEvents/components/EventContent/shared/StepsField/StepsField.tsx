import styles from './StepsField.module.scss';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import clsx from 'clsx';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  className?: string;
};

const StepsField = ({ value, onChange, min = 0, className }: Props) => {
  return (
    <div className={clsx(styles.container, className)}>
      <NumberInput
        value={value}
        onChange={onChange}
        min={min}
        className={styles.input}
      />
    </div>
  );
};

export default StepsField;

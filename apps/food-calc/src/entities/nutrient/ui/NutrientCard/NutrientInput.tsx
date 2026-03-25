import { forwardRef } from 'react';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import styles from './NutrientInput.module.scss';

interface NutrientInputProps {
  value: number;
  onChange: (value: number) => void;
  unit: string;
  norm?: number;
}

const NutrientInput = forwardRef<HTMLInputElement, NutrientInputProps>(
  ({ value, onChange, unit, norm }, ref) => (
    <div className={styles.row}>
      <NumberInput
        ref={ref}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
      {norm !== undefined && (
        <span className={styles.norm}>/ {norm}</span>
      )}
      <span className={styles.unit}>{unit}</span>
    </div>
  )
);

NutrientInput.displayName = 'NutrientInput';

export default NutrientInput;

import { forwardRef } from 'react';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './NutrientInput.module.scss';

interface NutrientInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  norm?: number;
}

const NutrientInput = forwardRef<HTMLInputElement, NutrientInputProps>(
  ({ id, value, onChange, unit, norm }, ref) => (
    <div className={styles.row}>
      <NumberInput
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
      {norm !== undefined && (
        <Text as="span" role="caption" className={styles.norm}>/ {norm}</Text>
      )}
      <Text as="span" role="caption" className={styles.unit}>{unit}</Text>
    </div>
  )
);

NutrientInput.displayName = 'NutrientInput';

export default NutrientInput;

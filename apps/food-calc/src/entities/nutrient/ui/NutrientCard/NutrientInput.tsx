import { forwardRef } from 'react';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './NutrientInput.module.scss';

interface NutrientInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
}

// Авторинг состава: только значение + единица. Суточная норма («/ 90») здесь НЕ
// показывается — это про потребление/анализ, а ты описываешь, что лежит в еде;
// подмешивать норму в поле ввода = категориальная ошибка (снято 2026-07-11).
const NutrientInput = forwardRef<HTMLInputElement, NutrientInputProps>(
  ({ id, value, onChange, unit }, ref) => (
    <div className={styles.row}>
      <NumberInput
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
      <Text as="span" role="caption" className={styles.unit}>{unit}</Text>
    </div>
  )
);

NutrientInput.displayName = 'NutrientInput';

export default NutrientInput;

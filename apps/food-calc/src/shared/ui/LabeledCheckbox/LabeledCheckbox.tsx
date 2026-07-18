import styles from './LabeledCheckbox.module.scss';
import React, { type Ref } from 'react';
import { Text } from '@/shared/ui/atoms/Typography';

type Props = {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  /** Тихий контент в правом крае пилюли (напр. базис «на 100 г»). */
  trailing?: React.ReactNode;
  disabled?: boolean;
  /**
   * «Голый» ряд: снимает собственную field-обвязку (фон-пилюлю, тень, бровку,
   * скругление) — галочка живёт как верхний ряд чужого well'а и наследует его
   * chrome. Дефолт `false` (обычная пилюля). Ср. `onSurface` у Button/Chip/Choice
   * (тот ПЕРЕКРАШИВАЕТ фон по тиру; этот вообще СНИМАЕТ хром — семантика уже).
   */
  bare?: boolean;
  id?: string;
  /** Лёг на внутренний `<input type="checkbox">` — отсюда и тип. */
  ref?: Ref<HTMLInputElement>;
};

const LabeledCheckbox = ({ checked, onChange, label, trailing, disabled = false, bare = false, id, ref }: Props) => {
  const handleChange = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  return (
    <label
      className={`${styles.container} ${disabled ? styles.disabled : ''} ${bare ? styles.bare : ''}`}
      htmlFor={id}
    >
      <input
        ref={ref}
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.checkbox}
      />
      <Text role="label" as="span" className={styles.label}>
        {label}
      </Text>
      {trailing != null && (
        <Text role="caption" as="span" className={styles.trailing}>
          {trailing}
        </Text>
      )}
    </label>
  );
};

export default LabeledCheckbox;

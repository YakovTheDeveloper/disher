import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './Chip.module.scss';

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Выбран/нажат — тёмная заливка. Вызывающий код сам решает семантику. */
  active?: boolean;
};

/**
 * Chip — унифицированная кнопка-чип для быстрого выбора текста.
 *
 * Презентационный компонент: только вид (белая пилюля с мягкой тенью, без
 * рамки — канон пикера нутриентов; выбранный — warm amber light-tonal из --sys-color-bg-selected) и
 * `active`-состояние. Поведение (toggle / single-select / мгновенный коммит)
 * задаёт вызывающий код через `onClick`. Консумеры: NutrientPickerDrawer,
 * DetailsChips «Особенности приёма», ProductQuantity, AtomBuilder.
 */
export function Chip({ active = false, className, type = 'button', children, ...rest }: ChipProps) {
  return (
    <button
      type={type}
      className={clsx(styles.chip, active && styles.active, className)}
      {...rest}
    >
      <Text role="label" as="span">
        {children}
      </Text>
    </button>
  );
}

export default Chip;

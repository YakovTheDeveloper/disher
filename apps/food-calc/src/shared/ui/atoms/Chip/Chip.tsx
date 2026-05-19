import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Chip.module.scss';

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Выбран/нажат — тёмная заливка. Вызывающий код сам решает семантику. */
  active?: boolean;
};

/**
 * Chip — унифицированная кнопка-чип для быстрого выбора текста.
 *
 * Презентационный компонент: только вид (тёплый pill) и `active`-состояние.
 * Поведение (toggle / single-select / мгновенный коммит) задаёт вызывающий
 * код через `onClick`. Образец визуала — чипы «Особенности приёма» в
 * FoodSchedule; переиспользуется в модалках AtomBuilder.
 */
export function Chip({ active = false, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      className={clsx(styles.chip, active && styles.active, className)}
      {...rest}
    />
  );
}

export default Chip;

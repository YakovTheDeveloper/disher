import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './Chip.module.scss';

/** Surface-тир ХОСТА, на котором лежит чип (= `--sys-color-surface-N`). */
export type ChipSurface = 0 | 1 | 2;

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Выбран/нажат — тёмная заливка. Вызывающий код сам решает семантику. */
  active?: boolean;
  /**
   * Surface-тир ХОСТА, на котором ЛЕЖИТ чип (0–2, = `--sys-color-surface-N`).
   * Чип «возвышается» на тир ВЫШЕ хоста — имитирует приподнятость цветом (вызывающий
   * код знает свой хост, как `Button.flat`; авто-детект через `[data-surface]` запрещён):
   *   • 0 = бежевый стол (surface-0) → светлая пилюля surface-1 #fefcf9. Дефолт.
   *   • 1 = парящий лист (surface-1) → белая пилюля surface-2 #ffffff.
   *   • 2 = белый модал/дровер (surface-2 = потолок) → выше тира по цвету нет:
   *     пилюля остаётся белой, но получает мягкую rest-тень, иначе сливается с белым хостом.
   */
  surface?: ChipSurface;
};

/**
 * Chip — унифицированная кнопка-чип для быстрого выбора текста.
 *
 * Презентационный компонент: только вид (белая пилюля с мягкой тенью, без
 * рамки — канон пикера нутриентов; выбранный — warm amber light-tonal из --sys-color-bg-selected) и
 * `active`-состояние. Заливку «покоя» вызывающий код подбирает под свою поверхность
 * через проп `surface` (0–2): чип возвышается на тир выше хоста цветом, а на потолке
 * (surface-2) — мягкой тенью. Поведение (toggle / single-select / мгновенный коммит)
 * задаёт вызывающий код через `onClick`. Живой консумер — DetailsChips «Особенности
 * приёма»; витрина — UiKitPage / предложка.
 */
export function Chip({
  active = false,
  surface = 0,
  className,
  type = 'button',
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      className={clsx(
        styles.chip,
        surface >= 1 && styles.onSheet,
        surface === 2 && styles.floating,
        active && styles.active,
        className,
      )}
      {...rest}
    >
      <Text role="label" as="span">
        {children}
      </Text>
    </button>
  );
}

export default Chip;

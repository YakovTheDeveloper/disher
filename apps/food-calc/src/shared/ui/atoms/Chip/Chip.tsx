import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './Chip.module.scss';

/** Surface-тир ХОСТА, на котором лежит чип (= `--sys-color-surface-N`). */
export type ChipSurface = 0 | 1 | 2;

/**
 * Селект-скин — как чип показывает `active`:
 *   • 'fill' (дефолт) — plum-заливка «выбрано» (читается прямо из sys-пары полюса
 *     --sys-color-bg-selected-plum / -text-on-selected-plum); покой плоский.
 *   • 'outline' — инверсия: покой ПРИПОДНЯТ (elevation), выбранный ПЛОСКИЙ + ink-рамка
 *     + жирнее текст. Заливка не применяется. Сейчас без живого консумера — витрина
 *     UiKit / предложка (фильтр разборов переехал на fill+warm 2026-07-05).
 */
export type ChipVariant = 'fill' | 'outline';

/**
 * Elevation-скин (ортогонален `surface`, как у Choice): `raised` — приподнят
 * мягкой тенью (`--sys-elevation-action-rest`), выбранный плоский; `flat` — без
 * тени, вместо неё тонкая рамка (плотные экраны).
 */
export type ChipElevation = 'raised' | 'flat';

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Выбран/нажат — тёмная заливка. Вызывающий код сам решает семантику. */
  active?: boolean;
  /** Селект-скин (см. {@link ChipVariant}). Дефолт 'fill' (plum). */
  variant?: ChipVariant;
  /**
   * Elevation-скин (см. {@link ChipElevation}). Дефолт `raised`. Комбинируется с
   * `onSurface` по контексту: разреженная модалка → `onSurface={0}` + `raised`;
   * плотный дровер → `onSurface={2}` + `flat` (surface-2 + рамка вместо тени).
   */
  elevation?: ChipElevation;
  /**
   * Surface-тир ХОСТА, на котором ЛЕЖИТ чип (0–2, = `--sys-color-surface-N`). Фон
   * задаёт общий миксин `bg-based-on-host-surface` (единый с Button/Choice).
   * Чип «возвышается» на тир ВЫШЕ хоста — имитирует приподнятость цветом (вызывающий
   * код знает свой хост, как `Button.flat`; авто-детект через `[data-surface]` запрещён):
   *   • 0 = бежевый стол (surface-0) → светлая пилюля surface-1 #fefcf9. Дефолт.
   *   • 1 = парящий лист (surface-1) → белая пилюля surface-2 #ffffff.
   *   • 2 = белый модал/дровер (surface-2 = потолок) → выше тира по цвету нет:
   *     пилюля остаётся белой. Отрыв от белого хоста несёт rest-тень (дефолт
   *     `elevation='raised'`); для плотных экранов переключи на `elevation='flat'`
   *     (тень → тонкая рамка).
   */
  onSurface?: ChipSurface;
};

/**
 * Chip — унифицированная кнопка-чип для быстрого выбора текста.
 *
 * Презентационный компонент: только вид (белая пилюля с мягкой тенью, без
 * рамки — канон пикера нутриентов; выбранный — plum-заливка из --sys-color-bg-selected-plum) и
 * `active`-состояние. Заливку «покоя» вызывающий код подбирает под свою поверхность
 * через проп `surface` (0–2): чип возвышается на тир выше хоста цветом, а на потолке
 * (surface-2) — мягкой тенью. Поведение (toggle / single-select / мгновенный коммит)
 * задаёт вызывающий код через `onClick`. Живой консумер — DetailsChips «Особенности
 * приёма»; витрина — UiKitPage / предложка.
 */
export function Chip({
  active = false,
  onSurface = 0,
  variant = 'fill',
  elevation = 'raised',
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
        onSurface >= 1 && styles.onSheet,
        elevation === 'flat' && styles.flat,
        variant === 'outline' && styles.outline,
        active && styles.active,
        className,
      )}
      {...rest}
    >
      <Text
        role="label"
        as="span"
        // outline-скин: выбранный чип жирнее (700) — вес через примитив, не сырой
        // font-weight в scss. Унифицирован с «выбранным» календаря/навигатора.
        weight={variant === 'outline' && active ? 'bold' : undefined}
      >
        {children}
      </Text>
    </button>
  );
}

export default Chip;

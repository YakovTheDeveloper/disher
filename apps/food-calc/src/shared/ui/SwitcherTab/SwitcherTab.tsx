import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import s from './SwitcherTab.module.scss';

export type SwitcherTabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Подпись таба. */
  label: string;
  /** Фоновая картинка-призрак (приглушённая), опционально. */
  image?: string;
  /** Активный таб — подпись = заголовок (Heading); иначе тихий указатель (Text). */
  active?: boolean;
  /** Подпись остаётся чёрной и непрозрачной даже у active-плитки. */
  solidLabel?: boolean;
};

/**
 * SwitcherTab — таб-переключатель экранов HomePage-ряда (`ScreenIndicator`): фоновая
 * картинка-призрак + подпись. Голос подписи берётся ПРЯМО из примитива по
 * состоянию: активный = `<Heading>` (display bold-sans), неактивный = `<Text
 * variant="navTabQuiet">` (тихий serif-указатель). Раскладку ряда (на своей
 * строке / в ряд / центр) задают `data-dv`-варианты `NavSwitcher` ТОЛЬКО
 * через layout — типографику они не трогают. Размер активного заголовка
 * вариант может переопределить (`font-size` на `.tileActive .tileTitle`).
 *
 * Положение картинки-призрака настраивается CSS-переменными — через
 * `style` или `className` потребителя (composite-only сдвиг/масштаб):
 *   --tile-img-x       сдвиг по горизонтали, + вправо   (default 0px)
 *   --tile-img-y       сдвиг по вертикали,  + вниз       (default 10px)
 *   --tile-img-scale   масштаб, >1 — плотнее обрезка     (default 1)
 *   --tile-img-opacity прозрачность                     (default 0.07)
 */
export const SwitcherTab = ({
  label,
  image,
  active,
  solidLabel,
  className,
  ...rest
}: SwitcherTabProps) => (
  <button
    type="button"
    className={clsx(s.tile, active && s.tileActive, solidLabel && s.tileSolidLabel, className)}
    {...rest}
  >
    {image && <img src={image} className={s.tileImg} alt="" aria-hidden />}
    {active ? (
      <Heading as="span" size="section" className={s.tileTitle}>
        {label}
      </Heading>
    ) : (
      <Text as="span" variant="navTabQuiet" className={s.tileTitle}>
        {label}
      </Text>
    )}
  </button>
);

export default SwitcherTab;

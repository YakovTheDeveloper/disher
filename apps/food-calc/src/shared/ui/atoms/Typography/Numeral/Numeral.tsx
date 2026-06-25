import clsx from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Numeral.module.scss';

/** Числовая size-шкала (ось размера, токены --sys-numeral-*). */
type NumeralSize = 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'display' | 'hero';
/** Ось веса — числа варьируют вес независимо от размера (тонкий герой ↔ жирный ридаут). */
type NumeralWeight =
  | 'thin' // 200
  | 'regular' // 400
  | 'medium' // 500
  | 'semibold' // 600
  | 'bold' // 700
  | 'black'; // 800

type Props = {
  children: ReactNode;
  /** Размер числового ридаута (числовая шкала, дефолт `base` = 16px). */
  size?: NumeralSize;
  /** Вес начертания (дефолт `medium` = 500). */
  weight?: NumeralWeight;
  /**
   * DOM-тег — polymorphic. По умолч. `span` (число обычно инлайн внутри строки).
   * Передай `p`/`b`/`strong` когда число — самостоятельный блок/акцент.
   */
  as?: ElementType;
  className?: string;
} & HTMLAttributes<HTMLElement>;

/**
 * Numeral — ЧИСЛОВОЙ типо-примитив (брат `Heading`/`Text`/`QuietLabel`). Дом
 * числового голоса: tabular + lining figures (`font-feature-settings: 'tnum' 'lnum'`)
 * + family `--font-big-numeric`. Используй для значений/количеств/таблиц/балансов —
 * там, где цифры должны выстраиваться в колонки и нести bespoke вес, не ложащийся в
 * прозовые роли `<Text>`. Цвет/раскладку задаёт консумер через className.
 */
const Numeral = ({ children, size = 'base', weight = 'medium', as, className, ...rest }: Props) => {
  const Tag = as ?? 'span';
  return (
    <Tag className={clsx(styles.numeral, styles[size], styles[weight], className)} {...rest}>
      {children}
    </Tag>
  );
};

export default Numeral;

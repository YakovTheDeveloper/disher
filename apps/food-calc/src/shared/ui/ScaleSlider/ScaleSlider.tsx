import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { Numeral } from '@/shared/ui/atoms/Typography';
import s from './ScaleSlider.module.scss';

interface ScaleSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  id?: string;
  ariaLabel?: string;
  className?: string;
  /** Скрыть живое число справа — когда значение вторично (напр. высота обложки:
   *  важен сам жест-растяжка, а не пиксели). Дефолт — число показано. */
  hideValue?: boolean;
  /** Ориентация трека. `vertical` — writing-mode-слайдер (min снизу, max сверху),
   *  тянется на всю высоту ячейки; число прячется (см. `hideValue`). Дефолт — `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * ScaleSlider — непрерывный слайдер со снапом к целым (0..10 по умолчанию): тонкий
 * монохромный трек, бегунок в touch-floor 44px, заливка до значения, опциональное
 * число справа (`hideValue`). Выбран под субъективную самооценку («оценочный вариант» события): точное число не
 * критично, а тянущийся жест мягче сетки из 11 кнопок и держит touch-канон. WebKit не
 * красит трек до бегунка сам — заливаем градиентом по инлайновому `--fill` (проценты);
 * Firefox использует нативный `::-moz-range-progress`.
 */
export const ScaleSlider = ({
  value,
  onChange,
  min = 0,
  max = 10,
  id,
  ariaLabel,
  className,
  hideValue = false,
  orientation = 'horizontal',
}: ScaleSliderProps) => {
  const fill = ((value - min) / (max - min)) * 100;
  const vertical = orientation === 'vertical';
  return (
    <div className={clsx(s.slider, vertical && s.vertical, className)}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={ariaLabel}
        aria-orientation={vertical ? 'vertical' : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
        className={s.input}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        // Драг бегунка не должен тянуть свайп-жест обёртки.
        data-base-ui-swipe-ignore
      />
      {!hideValue && (
        <Numeral as="output" size="lg" weight="bold" className={s.value}>
          {value}
        </Numeral>
      )}
    </div>
  );
};

export default ScaleSlider;

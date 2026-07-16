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
}

/**
 * ScaleSlider — непрерывный слайдер со снапом к целым (0..10 по умолчанию): толстый
 * бегунок (touch-floor 44px), заливка трека до текущего значения, живое число справа.
 * Выбран под субъективную самооценку («оценочный вариант» события): точное число не
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
}: ScaleSliderProps) => {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={clsx(s.slider, className)}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        className={s.input}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        // Горизонтальный драг бегунка не должен тянуть свайп-жест обёртки.
        data-base-ui-swipe-ignore
      />
      <Numeral as="output" size="lg" weight="bold" className={s.value}>
        {value}
      </Numeral>
    </div>
  );
};

export default ScaleSlider;

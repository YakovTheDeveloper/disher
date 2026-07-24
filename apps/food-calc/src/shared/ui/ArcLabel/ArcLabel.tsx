import { useId } from 'react';
import clsx from 'clsx';
import s from './ArcLabel.module.scss';

interface ArcLabelProps {
  /** Short caption bent along the arc (one word reads best). */
  text: string;
  /** Consumer owns size + colour (fill: currentColor). */
  className?: string;
  /** Дуга вывернута вниз (долина ∪) вместо арки вверх (∩) — зеркало через y=50. */
  flip?: boolean;
  /**
   * Радиус дуги в единицах viewBox(100), дефолт 70 (пологий штемпель). МЕНЬШЕ радиус
   * → сильнее выгиб (эндпоинты хорды x4→x96 те же, но дуга бугрится выше — крутая
   * «арка над иконкой»). Минимум ~47 (радиус < полухорды 46 → дуга невозможна).
   */
  radius?: number;
}

// Арка вверх (∩, sweep 1) и её зеркало-долина (∪, sweep 0) — симметричны через
// y=50, поэтому пары «продукт»/«блюдо» садятся на одной высоте, вывернутые. Хорда
// фиксирована (x4→x96 у y56/44), кривизну задаёт радиус.
const arcUp = (r: number) => `M 4,56 A ${r},${r} 0 0 1 96,56`;
const arcDown = (r: number) => `M 4,44 A ${r},${r} 0 0 0 96,44`;

/**
 * Декоративная надпись по дуге — голый SVG `textPath` без диска/тени/фокуса
 * (в отличие от `RoundButton`, который несёт интерактивную семантику медали).
 * Цвет = currentColor, размер = класс консумера. Кривизна = проп `radius` (дефолт
 * пологий 70 — буквы почти прямые, штемпель-стемпель); геометрия в единицах viewBox(100).
 */
export const ArcLabel = ({ text, className, flip = false, radius = 70 }: ArcLabelProps) => {
  // textPath ссылается на path по #id — уникализируем на инстанс, чтобы несколько
  // бейджей в списке не коллизировали (как arc-id в RoundButton).
  const arcId = `${useId().replace(/:/g, '')}-arc`;

  return (
    <svg className={clsx(s.arc, className)} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id={arcId} d={flip ? arcDown(radius) : arcUp(radius)} fill="none" />
      </defs>
      {/* fontSize — в единицах viewBox(100): ~22 * (диаметр/100) ≈ 10px на 44px-
          бейдже. Задаём атрибутом, а не CSS: это геометрия SVG-координат, а не
          прозовый размер (ни один --sys font-size токен сюда не ложится). */}
      <text fontSize={22}>
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
};

export default ArcLabel;

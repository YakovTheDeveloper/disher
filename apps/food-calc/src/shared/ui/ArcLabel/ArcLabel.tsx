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
}

// Арка вверх (∩, sweep 1) и её зеркало-долина (∪, sweep 0) — симметричны через
// y=50, поэтому пары «продукт»/«блюдо» садятся на одной высоте, вывернутые.
const ARC_UP = 'M 4,56 A 70,70 0 0 1 96,56';
const ARC_DOWN = 'M 4,44 A 70,70 0 0 0 96,44';

/**
 * Декоративная надпись по дуге — голый SVG `textPath` без диска/тени/фокуса
 * (в отличие от `WriteBarMedal`, который несёт интерактивную семантику медали).
 * Цвет = currentColor, размер = класс консумера. Дуга = пологая (буквы почти
 * прямые, читается как штемпель-стемпель), геометрия в единицах viewBox(100).
 */
export const ArcLabel = ({ text, className, flip = false }: ArcLabelProps) => {
  // textPath ссылается на path по #id — уникализируем на инстанс, чтобы несколько
  // бейджей в списке не коллизировали (как arc-id в WriteBarMedal).
  const arcId = `${useId().replace(/:/g, '')}-arc`;

  return (
    <svg className={clsx(s.arc, className)} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id={arcId} d={flip ? ARC_DOWN : ARC_UP} fill="none" />
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

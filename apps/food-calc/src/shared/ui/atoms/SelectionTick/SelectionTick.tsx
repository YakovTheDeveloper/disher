import type { SVGProps } from 'react';

// Канон-галочка «выбрано» (currentColor) — единый глиф для всех selection-маркеров
// (FoodActionCard tick-бейдж, чекбокс HypothesisListItem). Форма = бывший
// shared/assets/icons/tick.svg (viewBox 0 0 14 14, path M2 8 L6 12 L13 5).
// Размер/цвет задаёт родитель через CSS; интеракция (<input>, select-стиль ряда)
// остаётся на консументе — атом несёт ТОЛЬКО глиф.
// className/размеры пробрасываются на <svg> через {...props}.
export const SelectionTick = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
    <path
      d="M2 8 L6 12 L13 5"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SelectionTick;

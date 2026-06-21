import type { SVGProps } from 'react';

// Тихий шеврон › (currentColor) — единый affordance «откроет детали / следующий
// шаг». Размер задаёт родитель через CSS (везде 16px); путь тот же, что раньше
// инлайнился в QuietActionButton / NutrientsBar и теперь в карточках Открытий.
// className/размеры пробрасываются на <svg> через {...props}.
export const ChevronGlyph = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ChevronGlyph;

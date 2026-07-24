import type { CSSProperties, SVGProps } from 'react';
import type { IconGlyphSize } from '@/shared/ui/atoms/OpenPageGlyph';

interface ChevronGlyphProps extends SVGProps<SVGSVGElement> {
  /**
   * Опциональный размер из токен-шкалы `--sys-icon-size-*` (chrome 16 / xs 12 / sm 20 /
   * md 24). Не передан → поведение прежнее (размер несёт width/height или CSS родителя —
   * back-compat для существующих консумеров). Явные width/height перебивают токен.
   */
  size?: IconGlyphSize;
}

// Тихий шеврон › (currentColor) — единый affordance «откроет детали / следующий
// шаг». Размер задаёт родитель через CSS/width, либо named-проп `size` (токен-шкала).
// className/размеры пробрасываются на <svg> через {...props}.
export const ChevronGlyph = ({ size, width, height, style, ...props }: ChevronGlyphProps) => {
  const useToken = size != null && width == null && height == null;
  const sizeStyle: CSSProperties | undefined = useToken
    ? { width: `var(--sys-icon-size-${size})`, height: `var(--sys-icon-size-${size})` }
    : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      width={width}
      height={height}
      style={sizeStyle ? { ...sizeStyle, ...style } : style}
      {...props}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronGlyph;

import type { CSSProperties, SVGProps } from 'react';

/** Именованный размер глифа из шкалы `--sys-icon-size-*`. Дефолт `sm` (20). */
export type IconGlyphSize = 'chrome' | 'xs' | 'sm' | 'md';

interface OpenPageGlyphProps extends SVGProps<SVGSVGElement> {
  /**
   * Размер из токен-шкалы `--sys-icon-size-*` (chrome 16 / xs 12 / sm 20 / md 24) —
   * дефолт `sm`. Явные `width`/`height` (если переданы) перебивают токен: named-проп =
   * основной путь (не даёт call-site'ам изобретать px), px — эскейп-хэтч.
   */
  size?: IconGlyphSize;
}

// Стрелка ↗ (currentColor) — affordance «уйти на страницу целиком». Читается понятнее
// тихого шеврона ›: диагональ наружу-вверх = «перейти туда», а не «следующий шаг».
// Путь ЗАПОЛНЯЕТ ~60% viewBox (6..18) — раньше жил в центре (8..16, 1/3 box) и потому
// на равном номинале казался мельче плотного креста (оптический вес, а не номинал).
export const OpenPageGlyph = ({ size = 'sm', width, height, style, ...props }: OpenPageGlyphProps) => {
  const explicit = width != null || height != null;
  const dim = `var(--sys-icon-size-${size})`;
  const sizeStyle: CSSProperties | undefined = explicit ? undefined : { width: dim, height: dim };
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
        d="M6 18 L18 6 M18 12 L18 6 L12 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default OpenPageGlyph;

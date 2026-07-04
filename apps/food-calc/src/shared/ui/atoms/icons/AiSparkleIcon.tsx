import type { SVGProps } from 'react';

interface AiSparkleIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Сторона в px (viewBox 24×24). CSS у потребителя может переопределить. */
  size?: number;
}

// Минималистичный «AI/разбор»-глиф: крупная четырёхлучевая искра + малый спутник
// сверху-справа — канон «умного» действия (sparkle). Лучи рисуются квадратичными
// кривыми с контролем в центре звезды → вогнутые бока (искра, не ромб). Оба пути
// наследуют currentColor (на accent-кнопке = on-accent текст), viewBox фиксирован.
export function AiSparkleIcon({ size = 20, ...rest }: AiSparkleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {/* Крупная искра (центр 10,14) — лучи N/E/S/W, бока пинчатся к центру. */}
      <path
        d="M10 6 Q10 14 18 14 Q10 14 10 22 Q10 14 2 14 Q10 14 10 6 Z"
        fill="currentColor"
      />
      {/* Малый спутник (центр 18.5,6). */}
      <path
        d="M18.5 2.5 Q18.5 6 22 6 Q18.5 6 18.5 9.5 Q18.5 6 15 6 Q18.5 6 18.5 2.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default AiSparkleIcon;

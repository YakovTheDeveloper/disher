import type { SVGProps } from 'react';

export type PlusIconVariant = 'solid' | 'line';

interface PlusIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /**
   * `solid` — залитый скруглённый плюс (бывший 50×50 FAB-глиф, ProductDrawer /
   * AddPortionButton / free-text review / «Сохранить»-кнопки карт).
   * `line` — тонкий контурный плюс (бывший 20×20 stroke 1.8 глиф write-баров).
   * Разные viewBox; оба наследуют `currentColor`.
   */
  variant?: PlusIconVariant;
  /**
   * Сторона в px. По умолчанию — канон-размер варианта (solid 50, line 20).
   * Прокидывается напрямую (без фикс-пресетов); CSS у потребителя может его
   * переопределить (напр. `.add svg { width: 12px }`).
   */
  size?: number;
}

const DEFAULT_SIZE: Record<PlusIconVariant, number> = { solid: 50, line: 20 };

// Единый полиморфный плюс — свёл три bespoke-глифа (Button/PlusIcon 50×50 solid,
// WriteBarShell/PlusIcon 20×20 line, plus.svg в карточках) в один примитив.
// Solid-path рисуется без mask/id (контурная mask ломалась в Embla-слайдах
// HomePage — `url(#id)` не резолвился при contain + transform).
export function PlusIcon({ variant = 'solid', size, ...rest }: PlusIconProps) {
  const dim = size ?? DEFAULT_SIZE[variant];

  if (variant === 'line') {
    return (
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 50 50"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M25 0C29.4183 1.93129e-07 33 3.58172 33 8V17H42C46.4183 17 50 20.5817 50 25C50 29.4183 46.4183 33 42 33H33V42C33 46.4183 29.4183 50 25 50C20.5817 50 17 46.4183 17 42V33H8C3.58172 33 0 29.4183 0 25C0 20.5817 3.58172 17 8 17H17V8C17 3.58172 20.5817 -1.93129e-07 25 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default PlusIcon;

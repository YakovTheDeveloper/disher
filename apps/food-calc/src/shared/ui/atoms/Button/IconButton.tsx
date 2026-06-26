import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import s from './IconButton.module.scss';

// Тон icon-кнопки = press-трактовка. `neutral` — тихий глиф, на press заливается
// чернилами (system) с on-accent глифом. `danger` — danger-глиф, на press —
// danger-подложка (урна). Без тона — «голый» shell: вид целиком несёт className
// (напр. clear-× с собственной заливкой-пузырём), примитив даёт только каркас +
// usePressFeedback + a11y.
export type IconButtonTone = 'neutral' | 'danger';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Глиф (svg). currentColor; собственный размер несёт сам svg или `size`. */
  icon: ReactNode;
  /** Обязателен — у иконки-кнопки нет текстовой метки (a11y). */
  'aria-label': string;
  tone?: IconButtonTone;
  /** Сторона квадратного тап-таргета (px). Без фикс-пресетов — прокидывается. */
  size?: number;
}

// Icon-only кнопка: владеет usePressFeedback (JS data-pressed — надёжная press-
// инверсия там, где :active на iOS ненадёжен) + требует aria-label + tone.
// Экспортит только компонент (Fast Refresh — fastrefresh-screenindicator).
export const IconButton = ({
  icon,
  tone,
  size,
  className,
  style,
  type = 'button',
  ...props
}: IconButtonProps) => {
  const { pressed, pressProps } = usePressFeedback();
  return (
    <button
      type={type}
      className={clsx(
        s.iconButton,
        tone === 'neutral' && s.neutral,
        tone === 'danger' && s.danger,
        className
      )}
      style={size != null ? { ...style, width: size, height: size } : style}
      {...props}
      {...pressProps}
      data-pressed={pressed || undefined}
    >
      {icon}
    </button>
  );
};

export default IconButton;

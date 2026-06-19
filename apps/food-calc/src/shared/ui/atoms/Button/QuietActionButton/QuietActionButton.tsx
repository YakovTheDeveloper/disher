import type { ReactNode } from 'react';
import clsx from 'clsx';
import s from './QuietActionButton.module.scss';

type Props = {
  /** Visible text label. */
  label: string;
  /** Icon node — inherits `currentColor` (the muted text colour). */
  icon: ReactNode;
  /** Side the icon sits on relative to the label. Default `start`. */
  iconPosition?: 'start' | 'end';
  /** Ведомый шеврон в конце — affordance «это действие / откроет шаг». */
  chevron?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

// Ведомый шеврон ›: тихий маркер действия в конце кнопки (currentColor, тише
// текста). Тот же путь, что у NutrientsBar.chevron — единый жест.
const ChevronGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);;

/**
 * Тихая текст-кнопка-примитив: значок + label, без подложки, приглушённый
 * текст. Владеет ТОЛЬКО видом — значок, текст и действие задаёт консумер.
 * Образцы: `SuggestActionButton` (sparkle, iconPosition="start"),
 * `DailyNormButton` (флажок, iconPosition="end").
 */
export const QuietActionButton = ({
  label,
  icon,
  iconPosition = 'start',
  chevron = false,
  onClick,
  disabled,
  className,
  'aria-label': ariaLabel,
}: Props) => {
  const iconNode = (
    <span className={s.icon} aria-hidden="true">
      {icon}
    </span>
  );
  return (
    <button
      type="button"
      className={clsx(s.button, className)}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {iconPosition === 'start' && iconNode}
      {label}
      {iconPosition === 'end' && iconNode}
      {chevron && (
        <span className={s.chevron} aria-hidden="true">
          <ChevronGlyph />
        </span>
      )}
    </button>
  );
};

export default QuietActionButton;

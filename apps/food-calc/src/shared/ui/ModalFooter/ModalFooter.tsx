import { Button } from '@/shared/ui/atoms/Button';
import s from './ModalFooter.module.scss';

type ModalNextButtonLabelProps = {
  as: 'label';
  htmlFor: string;
  onClick?: () => void;
  variant?: 'next' | 'finish';
  label?: string;
};

type ModalNextButtonButtonProps = {
  as?: never;
  htmlFor?: never;
  onClick: () => void;
  variant?: 'next' | 'finish';
  label?: string;
  disabled?: boolean;
};

type ModalNextButtonProps = ModalNextButtonLabelProps | ModalNextButtonButtonProps;

const doneIcon = (
  <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const arrowIcon = (
  <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * ModalNextButton — primary Confirm для footer'а модалок (`right`-слот
 * `ModalShell.ActionButtons`). «Назад» живёт в `ModalHeader`, отдельной
 * prev-кнопки в footer'е больше нет.
 */
export const ModalNextButton = (props: ModalNextButtonProps) => {
  const isFinish = props.variant === 'finish';
  const label = props.label ?? (isFinish ? 'Готово' : 'Далее');
  const ariaLabel = isFinish ? 'Готово' : 'Далее';
  const trailingIcon = isFinish ? doneIcon : arrowIcon;

  // Канон сплошной CTA — `Button variant="system"` (та же тёмная заливка/press,
  // что у submitBtn авторизации). `.nextArrow` оставляет только footer-раскладку
  // (safe-area снизу). Стрелка/галка — ведомая иконка.
  if (props.as === 'label') {
    return (
      <Button
        variant="system"
        as="label"
        htmlFor={props.htmlFor}
        onClick={props.onClick}
        className={s.nextArrow}
        trailingIcon={trailingIcon}
        aria-label={ariaLabel}
      >
        {label}
      </Button>
    );
  }
  return (
    <Button
      variant="system"
      onClick={props.onClick}
      disabled={props.disabled === true}
      className={s.nextArrow}
      trailingIcon={trailingIcon}
      aria-label={ariaLabel}
    >
      {label}
    </Button>
  );
};

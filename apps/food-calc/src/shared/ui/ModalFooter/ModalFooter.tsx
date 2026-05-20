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
  const defaultLabel = isFinish ? 'Готово' : 'Далее';
  const label = props.label ?? defaultLabel;
  const content = (
    <>
      <span className={s.nextArrowLabel}>{label}</span>
      {isFinish ? doneIcon : arrowIcon}
    </>
  );
  const isDisabled = props.as !== 'label' && props.disabled === true;
  const className = [s.nextArrow, isDisabled ? s.nextArrowDisabled : '']
    .filter(Boolean)
    .join(' ');

  if (props.as === 'label') {
    return (
      <label
        htmlFor={props.htmlFor}
        onClick={props.onClick}
        className={className}
        aria-label={isFinish ? 'Готово' : 'Далее'}
      >
        {content}
      </label>
    );
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={isDisabled}
      className={className}
      aria-label={isFinish ? 'Готово' : 'Далее'}
    >
      {content}
    </button>
  );
};

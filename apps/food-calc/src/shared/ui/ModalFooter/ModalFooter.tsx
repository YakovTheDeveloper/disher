import type { ReactNode } from 'react';
import s from './ModalFooter.module.scss';

type FooterProps = {
  onBack: () => void;
  children: ReactNode;
};

export const ModalFooter = ({ onBack, children }: FooterProps) => (
  <div className={s.panel}>
    <button className={s.backButton} type="button" onClick={onBack}>
      Назад
    </button>
    <div className={s.primary}>{children}</div>
  </div>
);

type NextStepButtonProps = {
  htmlFor: string;
  label?: string;
};

export const NextStepButton = ({ htmlFor, label = 'Далее' }: NextStepButtonProps) => (
  <label htmlFor={htmlFor} className={s.nextLabel}>
    <span className={s.nextButton}>{label}</span>
  </label>
);

type ModalNextButtonLabelProps = {
  as: 'label';
  htmlFor: string;
};

type ModalNextButtonButtonProps = {
  as?: never;
  htmlFor?: never;
  onClick: () => void;
};

type ModalNextButtonProps = ModalNextButtonLabelProps | ModalNextButtonButtonProps;

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

export const ModalNextButton = (props: ModalNextButtonProps) => {
  if (props.as === 'label') {
    return (
      <label htmlFor={props.htmlFor} className={s.nextArrow} aria-label="Далее">
        {arrowIcon}
      </label>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={s.nextArrow} aria-label="Далее">
      {arrowIcon}
    </button>
  );
};

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

type NextArrowProps = {
  htmlFor?: string;
  onClick?: () => void;
};

export const NextArrow = ({ htmlFor, onClick }: NextArrowProps) => {
  const content = (
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
  return (
    <label onClick={onClick} htmlFor={htmlFor} className={s.nextArrow} aria-label="Далее">
      {content}
    </label>
  );
};

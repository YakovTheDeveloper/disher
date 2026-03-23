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

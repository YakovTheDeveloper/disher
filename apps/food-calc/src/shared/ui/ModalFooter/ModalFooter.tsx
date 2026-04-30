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

type Theme = 'events';

type ModalNextButtonLabelProps = {
  as: 'label';
  htmlFor: string;
  variant?: 'next' | 'finish';
  theme?: Theme;
  label?: string;
};

type ModalNextButtonButtonProps = {
  as?: never;
  htmlFor?: never;
  onClick: () => void;
  variant?: 'next' | 'finish';
  theme?: Theme;
  label?: string;
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

type ModalPrevButtonLabelProps = {
  as: 'label';
  htmlFor: string;
  onClick?: never;
  theme?: Theme;
};

type ModalPrevButtonButtonProps = {
  as?: never;
  htmlFor?: never;
  onClick: () => void;
  theme?: Theme;
};

type ModalPrevButtonProps = ModalPrevButtonLabelProps | ModalPrevButtonButtonProps;

const prevArrowIcon = (
  <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
    <path
      d="M19 12H5M11 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ModalPrevButton = (props: ModalPrevButtonProps) => {
  const content = (
    <>
      {prevArrowIcon}
      <span className={s.prevArrowLabel}>Назад</span>
    </>
  );
  const className = `${s.prevArrow} ${props.theme === 'events' ? s.prevArrowEvents : ''}`;

  if (props.as === 'label') {
    return (
      <label htmlFor={props.htmlFor} className={className} aria-label="Назад">
        {content}
      </label>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={className} aria-label="Назад">
      {content}
    </button>
  );
};

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
  const className = `${s.nextArrow} ${props.theme === 'events' ? s.nextArrowEvents : ''}`;

  if (props.as === 'label') {
    return (
      <label htmlFor={props.htmlFor} className={className} aria-label={isFinish ? 'Готово' : 'Далее'}>
        {content}
      </label>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={className} aria-label={isFinish ? 'Готово' : 'Далее'}>
      {content}
    </button>
  );
};

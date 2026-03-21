import clsx from 'clsx';
import s from './Breadcrumbs.module.scss';

type Props<T extends string> = {
  steps: T[];
  current: T;
  stepLabels: Record<T, string>;
  onStepClick: (step: T) => void;
};

function Breadcrumbs<T extends string>({ steps, current, stepLabels, onStepClick }: Props<T>) {
  return (
    <nav className={s.breadcrumbs}>
      {steps.map((stepName, i) => {
        const isClickable = current !== stepName;
        const isCurrent = current === stepName;

        return (
          <span key={stepName} className={s.crumbWrapper}>
            {i > 0 && <span className={s.separator}>/</span>}
            <button
              className={clsx(s.crumb, isClickable && s.completed, isCurrent && s.current)}
              onClick={() => isClickable && onStepClick(stepName)}
              disabled={!isClickable}
            >
              {stepLabels[stepName]}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;

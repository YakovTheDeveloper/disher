import clsx from 'clsx';
import s from './Breadcrumbs.module.scss';

type Props<T extends string> = {
  steps: T[];
  current: T;
  stepLabels: Record<T, string>;
  stepResults?: Partial<Record<T, React.ReactNode>>;
  onStepClick: (step: T) => void;
};

function Breadcrumbs<T extends string>({ steps, current, stepLabels, stepResults, onStepClick }: Props<T>) {
  return (
    <nav className={s.breadcrumbs}>
      {steps.map((stepName, i) => {
        const isClickable = current !== stepName;
        const isCurrent = current === stepName;
        const result = stepResults?.[stepName];

        return (
          <span key={stepName} className={s.crumbWrapper}>
            {i > 0 && <span className={s.separator}>/</span>}
            <button
              className={clsx(s.crumb, isClickable && s.completed, isCurrent && s.current)}
              onClick={() => isClickable && onStepClick(stepName)}
              disabled={!isClickable}
            >
              <span className={s.crumbLabel}>{stepLabels[stepName]}</span>
              {!isCurrent && result != null && <span className={s.crumbResult}>{result}</span>}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;

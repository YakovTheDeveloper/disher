import clsx from 'clsx';
import s from './Breadcrumbs.module.scss';

type Props<T extends string> = {
  steps: T[];
  current: T;
  stepLabels: Record<T, string>;
  onStepClick: (step: T) => void;
};

function Breadcrumbs<T extends string>({ steps, current, stepLabels, onStepClick }: Props<T>) {
  const currentIndex = steps.indexOf(current);

  return (
    <nav className={s.breadcrumbs}>
      {steps.map((stepName, i) => {
        const isCompleted = currentIndex > i;
        const isCurrent = current === stepName;

        return (
          <span key={stepName} className={s.crumbWrapper}>
            {i > 0 && <span className={s.separator}>/</span>}
            <button
              className={clsx(s.crumb, isCompleted && s.completed, isCurrent && s.current)}
              onClick={() => isCompleted && onStepClick(stepName)}
              disabled={!isCompleted}
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

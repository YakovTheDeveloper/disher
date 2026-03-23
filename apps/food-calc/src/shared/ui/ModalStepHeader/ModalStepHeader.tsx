import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import s from './ModalStepHeader.module.scss';

type Props<T extends string> = {
  currentStep: T;
  steps: T[];
  stepLabels: Record<T, string>;
  stepResults?: Partial<Record<T, React.ReactNode>>;
  onBack: () => void;
  onStepClick: (step: T) => void;
};

function ModalStepHeader<T extends string>({
  currentStep,
  steps,
  stepLabels,
  stepResults,
  onBack,
  onStepClick,
}: Props<T>) {
  return (
    <header className={s.header}>
      <button className={s.backButton} onClick={onBack} type="button">
        <ArrowLeftIcon />
      </button>
      <Breadcrumbs
        steps={steps}
        current={currentStep}
        stepLabels={stepLabels}
        stepResults={stepResults}
        onStepClick={onStepClick}
      />
    </header>
  );
}

export default ModalStepHeader;

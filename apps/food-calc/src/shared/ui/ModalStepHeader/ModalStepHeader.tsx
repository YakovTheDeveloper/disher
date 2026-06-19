import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { ModalHeader, type ModalHeaderProps } from '@/shared/ui/ModalHeader';
import s from './ModalStepHeader.module.scss';

type Props<T extends string> = ModalHeaderProps & {
  currentStep: T;
  steps: T[];
  stepLabels: Record<T, string>;
  stepResults?: Partial<Record<T, React.ReactNode>>;
  /** Шаги, посещённые в текущей сессии флоу — см. `Breadcrumbs`. */
  visitedSteps?: readonly T[];
  onStepClick: (step: T) => void;
  /**
   * Опциональный DesignBar-якорь (`useDesignVariant(...).anchor` или его
   * data-атрибуты). Спредится на корень `.stepHeader` — CSS-варианты шапки
   * читают `[data-dv][data-dv-v]` с предка. Без пропа — дефолтный вид.
   */
  headerAnchor?: {
    ref?: (el: HTMLElement | null) => void;
    'data-dv'?: string;
    'data-dv-v'?: string;
  };
};

/**
 * ModalStepHeader — обвязка многошаговых wizard-флоу. Композиция:
 * `ModalHeader` (стрелка назад + title флоу) + ряд `Breadcrumbs` под ним.
 * Стрелка = шаг −1; breadcrumbs `onStepClick` = прыжок на пройденный шаг.
 */
function ModalStepHeader<T extends string>({
  title,
  onBack,
  backLabel,
  trailing,
  currentStep,
  steps,
  stepLabels,
  stepResults,
  visitedSteps,
  onStepClick,
  headerAnchor,
}: Props<T>) {
  return (
    <div className={s.stepHeader} {...headerAnchor}>
      <ModalHeader title={title} onBack={onBack} backLabel={backLabel} trailing={trailing} />
      <div className={s.crumbs}>
        <Breadcrumbs
          steps={steps}
          current={currentStep}
          stepLabels={stepLabels}
          stepResults={stepResults}
          visitedSteps={visitedSteps}
          onStepClick={onStepClick}
        />
      </div>
    </div>
  );
}

export default ModalStepHeader;

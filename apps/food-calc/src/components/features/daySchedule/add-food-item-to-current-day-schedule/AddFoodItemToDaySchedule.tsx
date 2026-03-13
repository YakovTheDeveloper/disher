import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import clsx from 'clsx';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { TimeChoose } from '@/components/ui/TimeChoose';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';
import { domainStore } from '@/store/store';
import Button from '@/components/ui/atoms/Button/Button';
import s from './AddFoodItemToDaySchedule.module.scss';

type Step = 'idle' | 'time' | 'search' | 'quantity';

const STEPS: Step[] = ['time', 'search', 'quantity'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  time: 'Время',
  search: 'Продукт',
  quantity: 'Количество',
};

const NEXT_INPUT_ID: Record<string, string> = {
  time: 'search',
  search: 'quantity-input',
};

type Props = {
  scheduleId: string;
};

const AddFoodItemToDaySchedule = observer(({ scheduleId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  useSwipeableLock(step !== 'idle');
  const { foodScheduleStore } = domainStore;
  const draft = foodScheduleStore.foodDraft;

  // Focus delegation: when a label htmlFor focuses an input inside a collapsed modal,
  // the focus event bubbles up here and we open the corresponding step.
  // Double rAF + scrollIntoView fixes iOS Safari issue where the focused input
  // is not visible because iOS scrolled to its position while the modal was still collapsed.
  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === 'time-input-schedule-food') setStep('time');
    else if (id === 'search') setStep('search');
    else if (id === 'quantity-input') setStep('quantity');
    else return;

    // Wait for React to re-render (expand the modal), then scroll input into view
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => {
    draft.updateTime(time);
  };

  const handleFoodSelect = (payload: { variant: 'product' | 'dish'; id: string }) => {
    draft.update(payload.variant, payload.id);
    setStep('quantity');
  };

  const handleCommit = () => {
    foodScheduleStore.commitFoodDraft(scheduleId);
    setStep('idle');
  };

  const handleClose = () => {
    foodScheduleStore.clearFoodDraft();
    setStep('idle');
  };

  const goToStep = (target: Step) => {
    setStep(target);
  };

  const Breadcrumbs = ({ current }: { current: Exclude<Step, 'idle'> }) => {
    const currentIndex = STEPS.indexOf(current);

    return (
      <nav className={s.breadcrumbs}>
        {STEPS.map((stepName, i) => {
          if (stepName === 'idle') return null;
          const isCompleted = currentIndex > i;
          const isCurrent = current === stepName;

          return (
            <span key={stepName} className={s.crumbWrapper}>
              {i > 0 && <span className={s.separator}>/</span>}
              <button
                className={clsx(s.crumb, isCompleted && s.completed, isCurrent && s.current)}
                onClick={() => isCompleted && goToStep(stepName)}
                disabled={!isCompleted}
              >
                {STEP_LABELS[stepName as Exclude<Step, 'idle'>]}
              </button>
            </span>
          );
        })}
      </nav>
    );
  };

  const Header = ({ currentStep }: { currentStep: Exclude<Step, 'idle'> }) => (
    <header className={s.header}>
      <button className={s.backButton} onClick={handleClose}>
        ←
      </button>
      <Breadcrumbs current={currentStep} />
    </header>
  );

  const NextStepLabel = ({
    currentStep,
    children,
  }: {
    currentStep: Step;
    children: React.ReactNode;
  }) => {
    const nextInputId = NEXT_INPUT_ID[currentStep];
    if (!nextInputId) return null;

    return (
      <label htmlFor={nextInputId} className={s.nextLabel}>
        {children}
      </label>
    );
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Time */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="time" />
            <div className={s.spacer} />
            <div className={s.content}>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId="time-input-schedule-food"
              />
              <div className={s.finishButton}>
                <NextStepLabel currentStep="time">
                  <span className={s.nextButton}>Далее</span>
                </NextStepLabel>
              </div>
            </div>
          </div>
        }
      />

      {/* Step 2: Search Food */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="search" />
            <SearchFood
              mode="products-and-dishes"
              onFinish={handleFoodSelect}
              currentProductId={draft.contentProduct?.foodId}
              currentDishId={draft.contentDish?.dishId}
            />
          </div>
        }
      />

      {/* Step 3: Quantity */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="quantity" />
            <div className={s.spacer} />
            <div className={s.content}>
              {draft.content && <ProductQuantity content={draft.content} onFinish={() => {}} />}
              <div className={s.finishButton}>
                <Button variant="primary" onClick={handleCommit}>
                  Готово
                </Button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
});

export default AddFoodItemToDaySchedule;

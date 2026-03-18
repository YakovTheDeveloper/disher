import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import clsx from 'clsx';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { TimeChoose } from '@/components/ui/TimeChoose';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';
import { addScheduleFood } from '@/entities/schedule-food';
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

type FoodContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
};

type DraftState = {
  time: string;
  variant: 'product' | 'dish' | null;
  foodId: string | null;
  quantity: number;
  content: FoodContent | null;
};

const createEmptyDraft = (): DraftState => ({
  time: new Date().toTimeString().slice(0, 5),
  variant: null,
  foodId: null,
  quantity: 100,
  content: null,
});

type Props = {
  scheduleId: string;
};

const AddFoodItemToDaySchedule = ({ scheduleId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft);
  useSwipeableLock(step !== 'idle');

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === 'time-input-schedule-food') setStep('time');
    else if (id === 'search') setStep('search');
    else if (id === 'quantity-input') setStep('quantity');
    else return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  };

  const handleFoodSelect = (payload: { variant: 'product' | 'dish'; id: string }) => {
    setDraft((prev) => ({
      ...prev,
      variant: payload.variant,
      foodId: payload.id,
      content: { quantity: prev.quantity, updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })) },
    }));
    setStep('quantity');
  };

  const handleCommit = async () => {
    if (draft.variant && draft.foodId) {
      await addScheduleFood({
        date: scheduleId,
        time: draft.time,
        type: draft.variant === 'product' ? 'food' : 'dish',
        foodId: draft.variant === 'product' ? draft.foodId : null,
        dishId: draft.variant === 'dish' ? draft.foodId : null,
        quantity: draft.quantity,
      });
    }
    setDraft(createEmptyDraft());
    setStep('idle');
  };

  const handleClose = () => {
    setDraft(createEmptyDraft());
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
              currentProductId={draft.variant === 'product' ? draft.foodId ?? undefined : undefined}
              currentDishId={draft.variant === 'dish' ? draft.foodId ?? undefined : undefined}
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
};

export default AddFoodItemToDaySchedule;

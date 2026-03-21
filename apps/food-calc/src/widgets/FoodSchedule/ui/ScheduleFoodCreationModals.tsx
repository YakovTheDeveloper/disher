import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { addScheduleFood } from '@/entities/schedule-food';
import toaster from '@/shared/lib/toaster/toaster';
import Button from '@/shared/ui/atoms/Button/Button';
import s from './FoodScheduleModals.module.scss';

/**
 * Input IDs used for label→input focus delegation across all FoodSchedule modals.
 *
 * Each modal step is opened by a <label htmlFor={ID}> that focuses the corresponding <input id={ID}>.
 * The onFocusCapture handler reads e.target.id to determine which step is active.
 *
 * ScheduleFoodCreationModals (this file):
 *   - TIME_INPUT    → TimeChoose input (step: time)
 *   - SEARCH_INPUT  → SearchFood input (step: search)
 *   - QUANTITY_INPUT → ProductQuantity NumberInput (step: quantity)
 *
 * CopyToNewDishModal:
 *   - DISH_NAME_INPUT → TextInput for dish name (step: name)
 *
 * CopyToExistingDishModal:
 *   - SEARCH_INPUT    → SearchFood input (step: selectDish)
 */
export const MODAL_INPUT_IDS = {
  TIME_INPUT: 'time-input-schedule-food',
  SEARCH_INPUT: 'search',
  QUANTITY_INPUT: 'quantity-input',
  DISH_NAME_INPUT: 'dish-name-input',
} as const;

type Step = 'idle' | 'time' | 'search' | 'quantity';
type ActiveStep = Exclude<Step, 'idle'>;

const STEPS: ActiveStep[] = ['time', 'search', 'quantity'];

const STEP_LABELS: Record<ActiveStep, string> = {
  time: 'Время',
  search: 'Продукт',
  quantity: 'Количество',
};

const NEXT_INPUT_ID: Record<string, string> = {
  time: MODAL_INPUT_IDS.SEARCH_INPUT,
  search: MODAL_INPUT_IDS.QUANTITY_INPUT,
};

type DraftState = {
  time: string;
  variant: 'product' | 'dish' | null;
  productId: string | null;
  dishId: string | null;
  quantity: number;
};

const createEmptyDraft = (): DraftState => ({
  time: new Date().toTimeString().slice(0, 5),
  variant: null,
  productId: null,
  dishId: null,
  quantity: 100,
});

type Props = {
  scheduleId: string;
};

const ScheduleFoodCreationModals = ({ scheduleId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft);
  useSwipeableLock(step !== 'idle');

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === MODAL_INPUT_IDS.TIME_INPUT) setStep('time');
    else if (id === MODAL_INPUT_IDS.SEARCH_INPUT) setStep('search');
    else if (id === MODAL_INPUT_IDS.QUANTITY_INPUT) setStep('quantity');
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
      productId: payload.variant === 'product' ? payload.id : null,
      dishId: payload.variant === 'dish' ? payload.id : null,
    }));
    setStep('quantity');
  };

  const handleCommit = async () => {
    if (draft.variant && (draft.productId || draft.dishId)) {
      await addScheduleFood({
        date: scheduleId,
        time: draft.time,
        type: draft.variant === 'product' ? 'food' : 'dish',
        foodId: draft.productId,
        dishId: draft.dishId,
        quantity: draft.quantity,
      });
      toaster.success('Добавлено в расписание');
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

  const Header = ({ currentStep }: { currentStep: ActiveStep }) => (
    <header className={s.header}>
      <button className={s.backButton} onClick={handleClose}>
        ←
      </button>
      <Breadcrumbs
        steps={STEPS}
        current={currentStep}
        stepLabels={STEP_LABELS}
        onStepClick={goToStep}
      />
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
      {/* Step 1: Time — trigger: <label htmlFor={MODAL_INPUT_IDS.TIME_INPUT}> */}
      <ModalByLabel
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
                inputId={MODAL_INPUT_IDS.TIME_INPUT}
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

      {/* Step 2: Search Food — trigger: NextStepLabel(time) → htmlFor={MODAL_INPUT_IDS.SEARCH_INPUT} */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="search" />
            <SearchFood
              mode="products-and-dishes"
              onFinish={handleFoodSelect}
              activeItemId={draft.productId ?? draft.dishId ?? undefined}
              itemHtmlFor={MODAL_INPUT_IDS.QUANTITY_INPUT}
              inputId={MODAL_INPUT_IDS.SEARCH_INPUT}
            />
          </div>
        }
      />

      {/* Step 3: Quantity — trigger: handleFoodSelect → setStep('quantity') */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="quantity" />
            <div className={s.spacer} />
            <div className={s.content}>
              {draft.quantity && <ProductQuantity content={draft.quantity} onFinish={() => {}} />}
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

export default ScheduleFoodCreationModals;

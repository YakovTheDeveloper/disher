import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter, NextStepButton } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { addScheduleFood } from '@/entities/schedule-food';
import toaster from '@/shared/lib/toaster/toaster';
import Button from '@/shared/ui/atoms/Button/Button';

/**
 * Input IDs used for label→input focus delegation across all FoodSchedule modals.
 *
 * Each modal step is opened by a <label htmlFor={ID}> that focuses the corresponding <input id={ID}>.
 * The onFocusCapture handler reads e.target.id to determine which step is active.
 *
 * ScheduleFoodCreateModals (this file):
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

type FoodContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
};

type DraftState = {
  time: string;
  variant: 'product' | 'dish' | null;
  productId: string | null;
  dishId: string | null;
  foodName: string | null;
  quantity: number;
  content: FoodContent | null;
};

const DEFAULT_PRODUCT_ID = '1';

const createEmptyDraft = (): DraftState => ({
  time: new Date().toTimeString().slice(0, 5),
  variant: 'product',
  productId: DEFAULT_PRODUCT_ID,
  dishId: null,
  foodName: null,
  quantity: 100,
  content: null,
});

type Props = {
  scheduleId: string;
};

const ScheduleFoodCreateModals = ({ scheduleId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft);
  const [sessionKey, setSessionKey] = useState(0);
  useSwipeableLock(step !== 'idle');

  const INPUT_TO_STEP: Record<string, ActiveStep> = {
    [MODAL_INPUT_IDS.TIME_INPUT]: 'time',
    [MODAL_INPUT_IDS.SEARCH_INPUT]: 'search',
    [MODAL_INPUT_IDS.QUANTITY_INPUT]: 'quantity',
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const nextStep = INPUT_TO_STEP[target.id];
    if (!nextStep) return;

    setStep((prev) => {
      if (prev === 'idle') setDraft(createEmptyDraft());
      return nextStep;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  };

  const handleFoodSelect = (payload: { variant: 'product' | 'dish'; id: string; name: string }) => {
    setDraft((prev) => ({
      ...prev,
      variant: payload.variant,
      productId: payload.variant === 'product' ? payload.id : null,
      dishId: payload.variant === 'dish' ? payload.id : null,
      foodName: payload.name,
      content: {
        quantity: prev.quantity,
        updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })),
      },
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
    setSessionKey((k) => k + 1);
    setStep('idle');
  };

  const handleClose = () => {
    setDraft(createEmptyDraft());
    setSessionKey((k) => k + 1);
    setStep('idle');
  };

  useOverlayHistory(step !== 'idle', handleClose);

  const goToStep = (target: Step) => {
    setStep(target);
  };

  const quantityContent: FoodContent = draft.content ?? {
    quantity: draft.quantity,
    updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })),
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Time — trigger: <label htmlFor={MODAL_INPUT_IDS.TIME_INPUT}> */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell>
            <ModalStepHeader currentStep="time" steps={STEPS} stepLabels={STEP_LABELS} stepResults={{ time: draft.time, search: draft.foodName ?? undefined }} onBack={handleClose} onStepClick={goToStep} />
            <ModalShell.Spacer />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={MODAL_INPUT_IDS.TIME_INPUT}
              />
              <ModalFooter onBack={handleClose}>
                <NextStepButton htmlFor={MODAL_INPUT_IDS.SEARCH_INPUT} />
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 2: Search Food — trigger: NextStepButton → htmlFor={MODAL_INPUT_IDS.SEARCH_INPUT} */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <ModalShell>
            <ModalStepHeader currentStep="search" steps={STEPS} stepLabels={STEP_LABELS} stepResults={{ time: draft.time, search: draft.foodName ?? undefined }} onBack={handleClose} onStepClick={goToStep} />
            <SearchFood
              key={sessionKey}
              mode="products-and-dishes"
              onSelectFood={handleFoodSelect}
              activeItemId={draft.productId ?? draft.dishId ?? undefined}
              itemHtmlFor={MODAL_INPUT_IDS.QUANTITY_INPUT}
              inputId={MODAL_INPUT_IDS.SEARCH_INPUT}
            />
          </ModalShell>
        }
      />

      {/* Step 3: Quantity — trigger: handleFoodSelect → setStep('quantity') */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalStepHeader currentStep="quantity" steps={STEPS} stepLabels={STEP_LABELS} stepResults={{ time: draft.time, search: draft.foodName ?? undefined }} onBack={handleClose} onStepClick={goToStep} />
            <ModalShell.Spacer />
            <ModalShell.Body>
              {(draft.productId || draft.dishId) && (
                <ProductQuantity key={sessionKey} content={quantityContent} onFinish={() => {}} />
              )}
              <ModalFooter onBack={() => goToStep('search')}>
                <Button variant="primary-form" onClick={handleCommit}>
                  Готово
                </Button>
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleFoodCreateModals;

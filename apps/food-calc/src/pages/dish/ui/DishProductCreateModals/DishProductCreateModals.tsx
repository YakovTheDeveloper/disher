import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { addDishItem } from '@/entities/dish';
import toaster from '@/shared/lib/toaster/toaster';
import Button from '@/shared/ui/atoms/Button/Button';

export const DISH_MODAL_INPUT_IDS = {
  SEARCH_INPUT: 'dish-item-search',
  QUANTITY_INPUT: 'dish-item-quantity',
} as const;

type Step = 'idle' | 'search' | 'quantity';
type ActiveStep = Exclude<Step, 'idle'>;

const STEPS: ActiveStep[] = ['search', 'quantity'];

const STEP_LABELS: Record<ActiveStep, string> = {
  search: 'Продукт',
  quantity: 'Количество',
};

type FoodContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
};

type DraftState = {
  foodId: string | null;
  quantity: number;
  content: FoodContent | null;
};

const DEFAULT_PRODUCT_ID = '1';

const createEmptyDraft = (): DraftState => ({
  foodId: DEFAULT_PRODUCT_ID,
  quantity: 100,
  content: null,
});

type Props = {
  dishId: string;
};

const DishProductCreateModals = ({ dishId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft);
  const [sessionKey, setSessionKey] = useState(0);
  useSwipeableLock(step !== 'idle');

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === DISH_MODAL_INPUT_IDS.SEARCH_INPUT) setStep('search');
    else if (id === DISH_MODAL_INPUT_IDS.QUANTITY_INPUT) setStep('quantity');
    else return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleFoodSelect = (payload: { variant: 'product' | 'dish'; id: string }) => {
    if (payload.variant === 'dish') return;
    setDraft((prev) => ({
      ...prev,
      foodId: payload.id,
      content: {
        quantity: prev.quantity,
        updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })),
      },
    }));
    setStep('quantity');
  };

  const handleCommit = async () => {
    if (draft.foodId) {
      await addDishItem({
        dishId,
        foodId: draft.foodId,
        quantity: draft.quantity,
      });
      toaster.success('Продукт добавлен');
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
      {/* Step 1: Search Food */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <ModalShell>
            <ModalStepHeader currentStep="search" steps={STEPS} stepLabels={STEP_LABELS} onBack={handleClose} onStepClick={goToStep} />
            <SearchFood
              key={sessionKey}
              mode="products-only"
              onFinish={handleFoodSelect}
              activeItemId={draft.foodId ?? undefined}
              itemHtmlFor={DISH_MODAL_INPUT_IDS.QUANTITY_INPUT}
              inputId={DISH_MODAL_INPUT_IDS.SEARCH_INPUT}
            />
          </ModalShell>
        }
      />

      {/* Step 2: Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalStepHeader currentStep="quantity" steps={STEPS} stepLabels={STEP_LABELS} onBack={handleClose} onStepClick={goToStep} />
            <ModalShell.Spacer />
            <ModalShell.Body>
              {draft.foodId && <ProductQuantity key={sessionKey} content={quantityContent} onFinish={() => {}} />}
              <ModalFooter onBack={() => goToStep('search')}>
                <Button variant="primary" onClick={handleCommit}>
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

export default DishProductCreateModals;

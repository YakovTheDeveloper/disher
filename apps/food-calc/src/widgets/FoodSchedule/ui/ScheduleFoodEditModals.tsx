import { useCallback, useState } from 'react';
import { useStore } from '@livestore/react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter, ModalNextButton } from '@/shared/ui/ModalFooter';
import { SearchFood } from '@/features/food/food-search';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { updateScheduleFood } from '@/entities/schedule-food';
import { useProductPortions } from '@/entities/product';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useDishPortions } from '@/entities/dish';
import Button from '@/shared/ui/atoms/Button/Button';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import type { Portion } from '@/features/product/ProductQuantity';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';

const mapPortions = (
  results: readonly { readonly label: string; readonly amount: number; readonly unit: string; readonly grams: number }[] | undefined
): Portion[] =>
  results ? results.map(({ label, amount, unit, grams }) => ({ label, amount, unit, grams })) : [];

export const EDIT_MODAL_INPUT_IDS = {
  TIME_INPUT: 'time-input-edit-schedule-food',
  SEARCH_INPUT: 'search-edit',
  QUANTITY_INPUT: 'quantity-input-edit',
} as const;

type Step = 'idle' | 'time' | 'search' | 'quantity';

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

type Props = {
  item: ScheduleFoodWithRelations;
  initialStep?: Step;
  onClose: () => void;
};

const ScheduleFoodEditModals = ({ item, initialStep = 'idle', onClose }: Props) => {
  const { store } = useStore();
  const createInitialDraft = (): DraftState => ({
    time: item.time,
    variant: item.type === 'food' ? 'product' : 'dish',
    foodId: item.foodId || item.dishId || null,
    quantity: item.quantity,
    content: {
      quantity: item.quantity,
      updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })),
    },
  });

  const [step, setStep] = useState<Step>(initialStep);
  const [draft, setDraft] = useState<DraftState>(createInitialDraft);

  const productId = draft.variant === 'product' ? (draft.foodId ?? undefined) : undefined;
  const dishId = draft.variant === 'dish' ? (draft.foodId ?? undefined) : undefined;
  const foodPortions = useProductPortions(productId);
  const dishPortions = useDishPortions(dishId);

  useSwipeableLock(step !== 'idle');
  useOverlayHistory(step !== 'idle', () => {
    setStep('idle');
    onClose();
  });

  const handleClose = () => {
    setStep('idle');
    onClose();
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === EDIT_MODAL_INPUT_IDS.TIME_INPUT) setStep('time');
    else if (id === EDIT_MODAL_INPUT_IDS.SEARCH_INPUT) setStep('search');
    else if (id === EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT) setStep('quantity');
    else return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
    handleCommit();
  };

  const handleFoodSelect = (payload: { variant: 'product' | 'dish'; id: string }) => {
    const result = safeMutate(
      () =>
        updateScheduleFood(store, item.id, {
          time: draft.time,
          type: payload.variant === 'product' ? 'food' : 'dish',
          foodId: payload.variant === 'product' ? payload.id : null,
          dishId: payload.variant === 'dish' ? payload.id : null,
          quantity: draft.quantity,
        }),
      'Не удалось обновить'
    );
    if (result === undefined) return;
    setStep('idle');
    onClose();
  };

  const handleCommit = () => {
    if (draft.variant && draft.foodId) {
      const result = safeMutate(
        () =>
          updateScheduleFood(store, item.id, {
            time: draft.time,
            type: draft.variant === 'product' ? 'food' : 'dish',
            foodId: draft.variant === 'product' ? draft.foodId : null,
            dishId: draft.variant === 'dish' ? draft.foodId : null,
            quantity: draft.quantity,
          }),
        'Не удалось обновить'
      );
      if (result === undefined) return;
    }
    setStep('idle');
    onClose();
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Time */}
      <ModalByLabel
        position="fixed"
        isExpanded={step === 'time'}
        content={
          <ModalShell>
            <ModalShell.Spacer />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={EDIT_MODAL_INPUT_IDS.TIME_INPUT}
                after={<ModalNextButton onClick={handleCommit} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Search Food */}
      <ModalByLabel
        position="fixed"
        isExpanded={step === 'search'}
        content={
          <ModalShell>
            <SearchFood
              mode="products-and-dishes"
              onSelectFood={handleFoodSelect}
              activeItemId={draft.foodId ?? undefined}
              inputId={EDIT_MODAL_INPUT_IDS.SEARCH_INPUT}
            />
          </ModalShell>
        }
      />

      {/* Quantity */}
      <ModalByLabel
        position="fixed"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalShell.Spacer />
            <ModalShell.Body>
              {draft.content && (
                <ProductQuantity
                  content={{
                    ...draft.content,
                    food:
                      draft.variant === 'product'
                        ? { portions: mapPortions(foodPortions) }
                        : undefined,
                    dish:
                      draft.variant === 'dish'
                        ? { portions: mapPortions(dishPortions) }
                        : undefined,
                  }}
                  onFinish={() => {}}
                  inputId={EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT}
                  onNextButtonClick={handleCommit}
                />
              )}
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleFoodEditModals;

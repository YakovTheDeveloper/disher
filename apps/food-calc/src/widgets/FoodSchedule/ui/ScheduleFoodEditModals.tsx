import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { SearchFood } from '@/features/food/food-search';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { updateScheduleFood } from '@/entities/schedule-food';
import Button from '@/shared/ui/atoms/Button/Button';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';

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
  useSwipeableLock(step !== 'idle');
  useOverlayHistory(step !== 'idle', () => { setStep('idle'); onClose(); });

  const handleClose = () => { setStep('idle'); onClose(); };

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
  };

  const handleFoodSelect = async (payload: { variant: 'product' | 'dish'; id: string }) => {
    await updateScheduleFood(item.id, {
      time: draft.time,
      type: payload.variant === 'product' ? 'food' : 'dish',
      foodId: payload.variant === 'product' ? payload.id : null,
      dishId: payload.variant === 'dish' ? payload.id : null,
      quantity: draft.quantity,
    });
    setStep('idle');
    onClose();
  };

  const handleCommit = async () => {
    if (draft.variant && draft.foodId) {
      await updateScheduleFood(item.id, {
        time: draft.time,
        type: draft.variant === 'product' ? 'food' : 'dish',
        foodId: draft.variant === 'product' ? draft.foodId : null,
        dishId: draft.variant === 'dish' ? draft.foodId : null,
        quantity: draft.quantity,
      });
    }
    setStep('idle');
    onClose();
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Time */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell>
            <ModalShell.Spacer />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={EDIT_MODAL_INPUT_IDS.TIME_INPUT}
              />
              <ModalFooter onBack={handleClose}>
                <Button variant="primary" onClick={handleCommit}>
                  Готово
                </Button>
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Search Food */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <ModalShell>
            <SearchFood
              mode="products-and-dishes"
              onFinish={handleFoodSelect}
              activeItemId={draft.foodId ?? undefined}
              inputId={EDIT_MODAL_INPUT_IDS.SEARCH_INPUT}
            />
          </ModalShell>
        }
      />

      {/* Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalShell.Spacer />
            <ModalShell.Body>
              {draft.content && <ProductQuantity content={draft.content} onFinish={() => {}} inputId={EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT} />}
              <ModalFooter onBack={handleClose}>
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

export default ScheduleFoodEditModals;

import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { TimeChoose } from '@/components/ui/TimeChoose';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';
import { updateScheduleFood } from '@/entities/schedule-food';
import Button from '@/components/ui/atoms/Button/Button';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import s from './FoodScheduleModals.module.scss';

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

const EditScheduleFoodModal = ({ item, initialStep = 'idle', onClose }: Props) => {
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
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <div className={s.wrapper}>
            <div className={s.spacer} />
            <div className={s.content}>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={EDIT_MODAL_INPUT_IDS.TIME_INPUT}
              />
              <div className={s.finishButton}>
                <Button variant="primary" onClick={handleCommit}>
                  Готово
                </Button>
              </div>
            </div>
          </div>
        }
      />

      {/* Search Food */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <div className={s.wrapper}>
            <SearchFood
              mode="products-and-dishes"
              onFinish={handleFoodSelect}
              currentProductId={draft.variant === 'product' ? draft.foodId ?? undefined : undefined}
              currentDishId={draft.variant === 'dish' ? draft.foodId ?? undefined : undefined}
              inputId={EDIT_MODAL_INPUT_IDS.SEARCH_INPUT}
            />
          </div>
        }
      />

      {/* Quantity */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <div className={s.wrapper}>
            <div className={s.spacer} />
            <div className={s.content}>
              {draft.content && <ProductQuantity content={draft.content} onFinish={() => {}} inputId={EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT} />}
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

export default EditScheduleFoodModal;

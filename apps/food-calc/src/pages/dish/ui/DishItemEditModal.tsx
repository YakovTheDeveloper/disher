import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { updateDishItem } from '@/entities/dish';
import Button from '@/shared/ui/atoms/Button/Button';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import s from '@/widgets/FoodSchedule/ui/FoodScheduleModals.module.scss';

export const DISH_EDIT_MODAL_INPUT_IDS = {
  SEARCH_INPUT: 'dish-item-edit-search',
  QUANTITY_INPUT: 'dish-item-edit-quantity',
} as const;

type Step = 'idle' | 'search' | 'quantity';

type FoodContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
};

type DraftState = {
  foodId: string | null;
  quantity: number;
  content: FoodContent | null;
};

type EditItem = {
  id: string;
  foodId: string;
  quantity: number;
};

type Props = {
  item: EditItem;
  initialStep?: Step;
  onClose: () => void;
};

const DishItemEditModal = ({ item, initialStep = 'idle', onClose }: Props) => {
  const createInitialDraft = (): DraftState => ({
    foodId: item.foodId,
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
    if (id === DISH_EDIT_MODAL_INPUT_IDS.SEARCH_INPUT) setStep('search');
    else if (id === DISH_EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT) setStep('quantity');
    else return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleFoodSelect = async (payload: { variant: 'product' | 'dish'; id: string }) => {
    if (payload.variant === 'dish') return;
    await updateDishItem(item.id, { foodId: payload.id });
    setStep('idle');
    onClose();
  };

  const handleCommit = async () => {
    await updateDishItem(item.id, {
      foodId: draft.foodId ?? undefined,
      quantity: draft.quantity,
    });
    setStep('idle');
    onClose();
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Search Food */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <div className={s.wrapper}>
            <SearchFood
              mode="products-only"
              onFinish={handleFoodSelect}
              activeItemId={draft.foodId ?? undefined}
              inputId={DISH_EDIT_MODAL_INPUT_IDS.SEARCH_INPUT}
            />
          </div>
        }
      />

      {/* Quantity */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <div className={s.wrapper}>
            <div className={s.spacer} />
            <div className={s.content}>
              {draft.content && (
                <ProductQuantity
                  content={draft.content}
                  onFinish={() => {}}
                  inputId={DISH_EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT}
                />
              )}
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

export default DishItemEditModal;

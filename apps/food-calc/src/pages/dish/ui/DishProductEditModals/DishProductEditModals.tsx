import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { updateDishItem } from '@/entities/dish';
import Button from '@/shared/ui/atoms/Button/Button';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';

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

const DishProductEditModals = ({ item, initialStep = 'idle', onClose }: Props) => {
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
  useOverlayHistory(step !== 'idle', () => { setStep('idle'); onClose(); });

  const handleClose = () => { setStep('idle'); onClose(); };

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
          <ModalShell>
            <SearchFood
              mode="products-only"
              onFinish={handleFoodSelect}
              activeItemId={draft.foodId ?? undefined}
              inputId={DISH_EDIT_MODAL_INPUT_IDS.SEARCH_INPUT}
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
              {draft.content && (
                <ProductQuantity
                  content={draft.content}
                  onFinish={() => {}}
                  inputId={DISH_EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT}
                />
              )}
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

export default DishProductEditModals;

import { useCallback, useState } from 'react';
import { useStore } from '@livestore/react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { popOverlayEntry } from '@/shared/lib/overlay-history';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { SearchFood } from '@/features/food/food-search';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { updateDishItem } from '@/entities/dish';
import { useProductPortions } from '@/entities/product';
import { safeMutate } from '@/shared/lib/safeMutate';
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
  productId: string | null;
  quantity: number;
  content: FoodContent | null;
};

type EditItem = {
  id: string;
  productId: string;
  quantity: number;
  product?: { name: string } | null;
};

type Props = {
  item: EditItem;
  initialStep?: Step;
  onClose: () => void;
};

const DishProductEditModals = ({ item, initialStep = 'idle', onClose }: Props) => {
  const { store } = useStore();
  const { toProduct } = useAppRoutes();
  const createInitialDraft = (): DraftState => ({
    productId: item.productId,
    quantity: item.quantity,
    content: {
      quantity: item.quantity,
      updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })),
    },
  });

  const [step, setStep] = useState<Step>(initialStep);
  const [draft, setDraft] = useState<DraftState>(createInitialDraft);

  const foodPortionsMap = useProductPortions(draft.productId ?? undefined);

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
    const result = await safeMutate(
      () => updateDishItem(store, item.id, { productId: payload.id }),
      'Не удалось обновить'
    );
    if (result === undefined) return;
    setStep('idle');
    onClose();
  };

  const handleCommit = async () => {
    const result = await safeMutate(
      () =>
        updateDishItem(store, item.id, {
          productId: draft.productId ?? undefined,
          quantity: draft.quantity,
        }),
      'Не удалось обновить'
    );
    if (result === undefined) return;
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
              onSelectFood={handleFoodSelect}
              onInfoClick={async (_variant, id) => {
                await popOverlayEntry();
                toProduct(id);
              }}
              activeItemId={draft.productId ?? undefined}
              inputId={DISH_EDIT_MODAL_INPUT_IDS.SEARCH_INPUT}
              initialSearchQuery={item.product?.name ?? undefined}
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
            <ModalShell.Body>
              {draft.content && (
                <>
                  <ProductQuantity
                    content={{
                      ...draft.content,
                      product: { portions: foodPortionsMap ?? [] },
                    }}
                    onFinish={() => {}}
                    inputId={DISH_EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT}
                  />
                  <ModalShell.ActionButtons
                    left={<ModalPrevButton onClick={handleClose} />}
                    right={<ModalNextButton onClick={handleCommit} />}
                  />
                </>
              )}
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </div>
  );
};

export default DishProductEditModals;

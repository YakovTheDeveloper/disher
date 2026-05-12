import { useCallback, useMemo, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { addDishItem, updateDishItem } from '@/entities/dish';
import { useProductPortions } from '@/entities/product';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';

export const DISH_PRODUCT_INPUT_IDS = {
  // create
  SEARCH_CREATE_INPUT: 'dish-item-search',
  QUANTITY_CREATE_INPUT: 'dish-item-quantity',
  // edit
  SEARCH_EDIT_INPUT: 'dish-item-edit-search',
  QUANTITY_EDIT_INPUT: 'dish-item-edit-quantity',
} as const;

export type Step = 'idle' | 'search' | 'quantity';
type ActiveStep = Exclude<Step, 'idle'>;

export const CREATE_STEPS: ActiveStep[] = ['search', 'quantity'];
export const STEP_LABELS: Record<ActiveStep, string> = {
  search: 'Продукт',
  quantity: 'Количество',
};

export type DraftState = {
  productId: string | null;
  quantity: number;
};

export type EditItem = {
  id: string;
  productId: string;
  quantity: number;
  product?: { name: string | null } | null;
};

const DEFAULT_PRODUCT_ID = '1';

const createEmptyDraft = (): DraftState => ({
  productId: DEFAULT_PRODUCT_ID,
  quantity: 100,
});

const draftFromItem = (item: EditItem): DraftState => ({
  productId: item.productId,
  quantity: item.quantity,
});

type CreateMode = { type: 'create'; dishId: string };
type EditMode = { type: 'edit' };
export type FlowMode = CreateMode | EditMode;

export type DishProductFlow = ReturnType<typeof useDishProductFlow>;

export function useDishProductFlow(mode: FlowMode) {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(() => createEmptyDraft());
  const [editingItem, setEditingItem] = useState<EditItem | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  useSwipeableLock(step !== 'idle');

  const foodPortions = useProductPortions(draft.productId ?? undefined);

  const SEARCH_INPUT = mode.type === 'create'
    ? DISH_PRODUCT_INPUT_IDS.SEARCH_CREATE_INPUT
    : DISH_PRODUCT_INPUT_IDS.SEARCH_EDIT_INPUT;
  const QUANTITY_INPUT = mode.type === 'create'
    ? DISH_PRODUCT_INPUT_IDS.QUANTITY_CREATE_INPUT
    : DISH_PRODUCT_INPUT_IDS.QUANTITY_EDIT_INPUT;

  const INPUT_TO_STEP: Record<string, ActiveStep> = {
    [SEARCH_INPUT]: 'search',
    [QUANTITY_INPUT]: 'quantity',
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const nextStep = INPUT_TO_STEP[target.id];
    if (!nextStep) return;
    setStep(nextStep);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, [SEARCH_INPUT, QUANTITY_INPUT]);

  const handleClose = () => {
    if (mode.type === 'create') {
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);
    } else {
      setEditingItem(null);
      setDraft(createEmptyDraft());
    }
    setStep('idle');
  };

  // Open edit at a specific step. Mirrors ScheduleFoodFlow.startEdit — the
  // parent calls this on item click instead of mounting a modal with props.
  const startEdit = useCallback((item: EditItem, nextStep: ActiveStep) => {
    setEditingItem(item);
    setDraft(draftFromItem(item));
    setStep(nextStep);
  }, []);

  useOverlayHistory(step !== 'idle', handleClose);

  const handleFoodSelect = async (payload: { variant: 'product' | 'dish'; id: string; name?: string }) => {
    if (payload.variant === 'dish') return;

    if (mode.type === 'create') {
      setDraft((prev) => ({ ...prev, productId: payload.id }));
      setStep('quantity');
      return;
    }

    if (!editingItem) return;
    const result = await safeMutate(
      () => updateDishItem(editingItem.id, { productId: payload.id }),
      'Не удалось обновить'
    );
    if (!result.ok) return;
    setEditingItem(null);
    setDraft(createEmptyDraft());
    setStep('idle');
  };

  const handleCommit = async () => {
    if (mode.type === 'create') {
      if (draft.productId) {
        const result = await safeMutate(
          () => addDishItem({ dishId: mode.dishId, productId: draft.productId!, quantity: draft.quantity }),
          'Не удалось добавить продукт'
        );
        if (!result.ok) return;
        toaster.success('Продукт добавлен');
      }
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);
      setStep('idle');
      return;
    }

    if (!editingItem) return;
    const result = await safeMutate(
      () =>
        updateDishItem(editingItem.id, {
          productId: draft.productId ?? undefined,
          quantity: draft.quantity,
        }),
      'Не удалось обновить'
    );
    if (!result.ok) return;
    setEditingItem(null);
    setDraft(createEmptyDraft());
    setStep('idle');
  };

  const updateQuantity = useCallback(
    (q: number) => setDraft((d) => ({ ...d, quantity: q })),
    [],
  );

  const quantityContent = useMemo(
    () => ({
      quantity: draft.quantity,
      updateQuantity,
      product: { portions: foodPortions ?? [] },
    }),
    [draft.quantity, updateQuantity, foodPortions],
  );

  return {
    step,
    setStep,
    draft,
    setDraft,
    editingItem,
    startEdit,
    sessionKey,
    handleFocusCapture,
    handleClose,
    handleFoodSelect,
    handleCommit,
    quantityContent,
    inputIds: { SEARCH_INPUT, QUANTITY_INPUT },
  };
}

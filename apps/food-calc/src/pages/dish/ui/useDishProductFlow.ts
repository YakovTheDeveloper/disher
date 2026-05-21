import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { addDishItem, updateDishItem } from '@/entities/dish';
import { createProduct, useProductPortions } from '@/entities/product';
import { persistCustomTagsFromDetails } from '@/features/food/details-chips';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';

export const DISH_PRODUCT_INPUT_IDS = {
  // create
  SEARCH_CREATE_INPUT: 'dish-item-search',
  QUANTITY_CREATE_INPUT: 'dish-item-quantity',
  DETAILS_CREATE_INPUT: 'dish-item-details',
  CREATE_INPUT: 'dish-item-create-name',
  // edit
  SEARCH_EDIT_INPUT: 'dish-item-edit-search',
  QUANTITY_EDIT_INPUT: 'dish-item-edit-quantity',
  DETAILS_EDIT_INPUT: 'dish-item-edit-details',
} as const;

export type Step = 'idle' | 'search' | 'create' | 'quantity' | 'details';
type ActiveStep = Exclude<Step, 'idle'>;

// Full flow (3 steps) — used when the selected product has either a curated
// suggestion list or saved custom tags, so the details step is worth visiting.
export const CREATE_STEPS_WITH_DETAILS: ActiveStep[] = ['search', 'quantity', 'details'];
// Compact flow (2 steps) — details reachable via "+ деталь" opt-in on quantity.
export const CREATE_STEPS_NO_DETAILS: ActiveStep[] = ['search', 'quantity'];
// Backwards-compatible export — anything still importing CREATE_STEPS gets the full flow.
export const CREATE_STEPS = CREATE_STEPS_WITH_DETAILS;
export const STEP_LABELS: Record<ActiveStep, string> = {
  search: 'Еда',
  create: 'Создать',
  quantity: 'Порция',
  details: 'Заметка',
};

export type DraftState = {
  productId: string | null;
  /** Prefill для шага create — поисковый запрос юзера, по которому он не нашёл и тапнул «+ Продукт». */
  foodName: string | null;
  quantity: number;
  details: string;
};

export type EditItem = {
  id: string;
  productId: string;
  quantity: number;
  details?: string;
  product?: { name: string | null } | null;
};

const DEFAULT_PRODUCT_ID = '1';

const createEmptyDraft = (): DraftState => ({
  productId: DEFAULT_PRODUCT_ID,
  foodName: null,
  quantity: 100,
  details: '',
});

const draftFromItem = (item: EditItem): DraftState => ({
  productId: item.productId,
  foodName: item.product?.name ?? null,
  quantity: item.quantity,
  details: item.details ?? '',
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
  // Посещённые шаги текущей сессии — для `results`-вида Breadcrumbs.
  // Обнуляется при возврате в 'idle' (любое закрытие/коммит).
  const [visitedSteps, setVisitedSteps] = useState<ActiveStep[]>([]);

  useSwipeableLock(step !== 'idle');

  useEffect(() => {
    if (step === 'idle') {
      setVisitedSteps((prev) => (prev.length ? [] : prev));
      return;
    }
    setVisitedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, [step]);

  const foodPortions = useProductPortions(draft.productId ?? undefined);

  const SEARCH_INPUT = mode.type === 'create'
    ? DISH_PRODUCT_INPUT_IDS.SEARCH_CREATE_INPUT
    : DISH_PRODUCT_INPUT_IDS.SEARCH_EDIT_INPUT;
  const QUANTITY_INPUT = mode.type === 'create'
    ? DISH_PRODUCT_INPUT_IDS.QUANTITY_CREATE_INPUT
    : DISH_PRODUCT_INPUT_IDS.QUANTITY_EDIT_INPUT;
  const DETAILS_INPUT = mode.type === 'create'
    ? DISH_PRODUCT_INPUT_IDS.DETAILS_CREATE_INPUT
    : DISH_PRODUCT_INPUT_IDS.DETAILS_EDIT_INPUT;
  const CREATE_INPUT = DISH_PRODUCT_INPUT_IDS.CREATE_INPUT;

  const INPUT_TO_STEP: Record<string, ActiveStep> = {
    [SEARCH_INPUT]: 'search',
    [QUANTITY_INPUT]: 'quantity',
    [DETAILS_INPUT]: 'details',
    // CREATE_INPUT валиден только в create-режиме — edit никогда не открывает создание.
    ...(mode.type === 'create' ? { [CREATE_INPUT]: 'create' as ActiveStep } : {}),
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
  }, [SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT, CREATE_INPUT, mode.type]);

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

  // Prime editing state without changing step. Used by tap-on-name in
  // DishBuilderPage where <label htmlFor={DETAILS_EDIT_INPUT}> delegates
  // focus to the details textarea — onFocusCapture flips step to 'details'
  // on the same focus event (keeps iOS Safari keyboard popping reliably).
  const primeEdit = useCallback((item: EditItem) => {
    setEditingItem(item);
    setDraft(draftFromItem(item));
  }, []);

  useOverlayHistory(step !== 'idle', handleClose);

  const handleFoodSelect = async (payload: { variant: 'product' | 'dish'; id: string; name?: string }) => {
    if (payload.variant === 'dish') return;

    if (mode.type === 'create') {
      // Только пишем draft — НЕ зовём setStep. Переход на 'quantity' делает
      // делегирование фокуса: карточка в SearchFood это <label htmlFor=
      // {QUANTITY_INPUT}>, фокус на инпуте ловит onFocusCapture. Синхронный
      // setStep здесь размонтировал бы <label> до делегирования фокуса
      // (см. CLAUDE.md «Label focus delegation»). Совпадает с HomePage-флоу.
      setDraft((prev) => ({ ...prev, productId: payload.id, foodName: payload.name ?? null }));
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

  // Stash the proposed name in draft when the user clicks «+ Продукт» on
  // SearchFood's empty state. Step transition to 'create' happens via
  // onFocusCapture once label htmlFor={CREATE_INPUT} delegates focus.
  // На DishPage variant всегда product — блюда в блюда не вкладываются.
  const handlePickCreate = useCallback(
    (variant: 'product' | 'dish', name: string) => {
      if (variant !== 'product') return;
      setDraft((d) => ({
        ...d,
        productId: null,
        foodName: name,
      }));
    },
    [],
  );

  // Confirm the create-name step: optimistically stamp a UUID into draft so
  // the subsequent quantity step has a stable id, then fire-and-forget Dexie
  // write. setStep is NOT called here — Confirm в UI рендерится как <label
  // htmlFor={QUANTITY_INPUT}> и onFocusCapture флипает шаг после делегации
  // фокуса. См. CLAUDE.md «Label focus delegation».
  const handleConfirmCreate = useCallback(
    (name: string) => {
      if (mode.type !== 'create') return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const id = crypto.randomUUID();
      setDraft((d) => ({
        ...d,
        productId: id,
        foodName: trimmed,
      }));
      // Rollback the flow if Dexie write fails (quota / IDB locked) — иначе
      // draft.productId укажет на несуществующую строку и handleCommit
      // запишет orphan dish_item.
      const rollback = () => {
        setStep('idle');
        setDraft(createEmptyDraft());
        setSessionKey((k) => k + 1);
      };
      void safeMutate(
        () => createProduct({ id, name: trimmed }),
        'Не удалось создать продукт',
      ).then((res) => {
        if (!res.ok) rollback();
      });
    },
    [mode.type],
  );

  const handleCommit = async () => {
    if (mode.type === 'create') {
      if (draft.productId) {
        const detailsValue = draft.details.trim();
        const productIdForCustom = draft.productId;
        const result = await safeMutate(
          () => addDishItem({
            dishId: mode.dishId,
            productId: draft.productId!,
            quantity: draft.quantity,
            details: detailsValue,
          }),
          'Не удалось добавить продукт'
        );
        if (!result.ok) return;
        void persistCustomTagsFromDetails(productIdForCustom, detailsValue);
        toaster.success('Продукт добавлен');
      }
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);
      setStep('idle');
      return;
    }

    if (!editingItem) return;
    const detailsValue = draft.details.trim();
    const productIdForCustom = draft.productId ?? editingItem.productId;
    const result = await safeMutate(
      () =>
        updateDishItem(editingItem.id, {
          productId: draft.productId ?? undefined,
          quantity: draft.quantity,
          details: detailsValue,
        }),
      'Не удалось обновить'
    );
    if (!result.ok) return;
    void persistCustomTagsFromDetails(productIdForCustom, detailsValue);
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
    primeEdit,
    sessionKey,
    visitedSteps,
    handleFocusCapture,
    handleClose,
    handleFoodSelect,
    handlePickCreate,
    handleConfirmCreate,
    handleCommit,
    quantityContent,
    inputIds: { SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT, CREATE_INPUT },
  };
}

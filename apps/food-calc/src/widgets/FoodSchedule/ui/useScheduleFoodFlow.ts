import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@livestore/react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { addScheduleFood, updateScheduleFood } from '@/entities/schedule-food';
import { useProductPortions } from '@/entities/product';
import { useDishPortions } from '@/entities/dish';
import { safeMutate } from '@/shared/lib/safeMutate';
import { highlightListItem } from '@/shared/lib/emitter/emitter';
import toaster from '@/shared/lib/toaster/toaster';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';

export const SCHEDULE_FOOD_INPUT_IDS = {
  // create
  SEARCH_INPUT: 'search',
  DETAILS_INPUT: 'details-input',
  // edit
  SEARCH_EDIT_INPUT: 'search-edit',
  QUANTITY_EDIT_INPUT: 'quantity-input-edit',
  DETAILS_EDIT_INPUT: 'details-input-edit',
  // shared (different IDs so both can coexist in the DOM at once)
  TIME_CREATE_INPUT: 'time-input-schedule-food',
  TIME_EDIT_INPUT: 'time-input-edit-schedule-food',
  QUANTITY_CREATE_INPUT: 'quantity-input',
} as const;

export type Step = 'idle' | 'time' | 'search' | 'quantity' | 'details';
type ActiveStep = Exclude<Step, 'idle'>;

export const CREATE_STEPS: ActiveStep[] = ['search', 'time', 'quantity'];
export const STEP_LABELS: Record<ActiveStep, string> = {
  time: 'Время',
  search: 'Продукт',
  quantity: 'Количество',
  details: 'Заметка',
};

type FoodContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
};

export type DraftState = {
  time: string;
  variant: 'product' | 'dish' | null;
  productId: string | null;
  dishId: string | null;
  foodName: string | null;
  quantity: number;
  details: string;
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
  details: '',
  content: null,
});

const draftFromItem = (item: ScheduleFoodWithRelations): DraftState => ({
  time: item.time,
  variant: item.type === 'food' ? 'product' : 'dish',
  productId: item.type === 'food' ? (item.productId ?? null) : null,
  dishId: item.type === 'dish' ? (item.dishId ?? null) : null,
  foodName: item.product?.name ?? item.dish?.name ?? null,
  quantity: item.quantity,
  details: item.details ?? '',
  content: null,
});

type CreateMode = {
  type: 'create';
  scheduleId: string;
  richNutrient?: { id: string; unit: string } | null;
  onRichNutrientClear?: () => void;
};

type EditMode = {
  type: 'edit';
  item: ScheduleFoodWithRelations;
  initialStep?: Step;
  onClose: () => void;
};

export type FlowMode = CreateMode | EditMode;

export function useScheduleFoodFlow(mode: FlowMode) {
  const { store } = useStore();

  const [step, setStep] = useState<Step>(
    mode.type === 'edit' ? (mode.initialStep ?? 'idle') : 'idle'
  );
  const [draft, setDraft] = useState<DraftState>(() =>
    mode.type === 'create' ? createEmptyDraft() : draftFromItem(mode.item)
  );
  const [sessionKey, setSessionKey] = useState(0);

  useSwipeableLock(step !== 'idle');

  const richNutrient = mode.type === 'create' ? mode.richNutrient : null;

  // Auto-open search when richNutrient is set externally (create mode only)
  useEffect(() => {
    if (mode.type === 'create' && richNutrient && step === 'idle') {
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);
      setStep('search');
    }
  }, [richNutrient]);

  const foodPortions = useProductPortions(
    draft.variant === 'product' ? (draft.productId ?? undefined) : undefined
  );
  const dishPortions = useDishPortions(
    draft.variant === 'dish' ? (draft.dishId ?? undefined) : undefined
  );

  const TIME_INPUT = mode.type === 'create'
    ? SCHEDULE_FOOD_INPUT_IDS.TIME_CREATE_INPUT
    : SCHEDULE_FOOD_INPUT_IDS.TIME_EDIT_INPUT;
  const SEARCH_INPUT = mode.type === 'create'
    ? SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT
    : SCHEDULE_FOOD_INPUT_IDS.SEARCH_EDIT_INPUT;
  const QUANTITY_INPUT = mode.type === 'create'
    ? SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT
    : SCHEDULE_FOOD_INPUT_IDS.QUANTITY_EDIT_INPUT;

  const DETAILS_INPUT = mode.type === 'create'
    ? SCHEDULE_FOOD_INPUT_IDS.DETAILS_INPUT
    : SCHEDULE_FOOD_INPUT_IDS.DETAILS_EDIT_INPUT;

  const INPUT_TO_STEP: Record<string, ActiveStep> = {
    [TIME_INPUT]: 'time',
    [SEARCH_INPUT]: 'search',
    [QUANTITY_INPUT]: 'quantity',
    [DETAILS_INPUT]: 'details',
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const nextStep = INPUT_TO_STEP[target.id];
    if (!nextStep) return;

    setStep((prev) => {
      if (prev === 'idle' && mode.type === 'create') setDraft(createEmptyDraft());
      return nextStep;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleClose = () => {
    if (mode.type === 'create') {
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);
      mode.onRichNutrientClear?.();
    } else {
      mode.onClose();
    }
    setStep('idle');
  };

  useOverlayHistory(step !== 'idle', handleClose);

  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  };

  const handleFoodSelect = (payload: { variant: 'product' | 'dish'; id: string; name: string }) => {
    if (mode.type === 'create') {
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
      setStep('time');
    } else {
      const ok = safeMutate(
        () => {
          updateScheduleFood(store, mode.item.id, {
            time: draft.time,
            type: payload.variant === 'product' ? 'food' : 'dish',
            productId: payload.variant === 'product' ? payload.id : null,
            dishId: payload.variant === 'dish' ? payload.id : null,
            quantity: draft.quantity,
            details: draft.details.trim() || null,
          });
          return true;
        },
        'Не удалось обновить'
      );
      if (ok === undefined) return;
      setStep('idle');
      mode.onClose();
    }
  };

  const handleCommit = () => {
    if (mode.type === 'create') {
      if (draft.variant && (draft.productId || draft.dishId)) {
        const newId = safeMutate(
          () => addScheduleFood(store, {
            date: mode.scheduleId,
            time: draft.time,
            type: draft.variant === 'product' ? 'food' : 'dish',
            productId: draft.productId,
            dishId: draft.dishId,
            quantity: draft.quantity,
            details: draft.details.trim() || null,
          }),
          'Не удалось добавить в расписание',
        );
        if (newId === undefined) return;
        toaster.success('Добавлено в расписание');

        requestAnimationFrame(() => {
          setTimeout(() => {
            const el = document.querySelector(`[data-schedule-food-id="${newId}"]`);
            if (el) {
              el.scrollIntoView({ block: 'center', behavior: 'smooth' });
              highlightListItem(newId);
            }
          }, 150);
        });
      }
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);
      mode.onRichNutrientClear?.();
    } else {
      if (draft.variant && (draft.productId || draft.dishId)) {
        const ok = safeMutate(
          () => {
            updateScheduleFood(store, mode.item.id, {
              time: draft.time,
              type: draft.variant === 'product' ? 'food' : 'dish',
              productId: draft.variant === 'product' ? draft.productId : null,
              dishId: draft.variant === 'dish' ? draft.dishId : null,
              quantity: draft.quantity,
              details: draft.details.trim() || null,
            });
            return true;
          },
          'Не удалось обновить'
        );
        if (ok === undefined) return;
      }
      mode.onClose();
    }
    setStep('idle');
  };

  const quantityContent = {
    ...(draft.content ?? {
      quantity: draft.quantity,
      updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })),
    }),
    product: draft.variant === 'product' ? { portions: foodPortions ?? [] } : undefined,
    dish: draft.variant === 'dish' ? { portions: dishPortions ?? [] } : undefined,
  };

  return {
    step,
    setStep,
    draft,
    setDraft,
    sessionKey,
    handleFocusCapture,
    handleClose,
    handleTimeFinish,
    handleFoodSelect,
    handleCommit,
    quantityContent,
    inputIds: { TIME_INPUT, SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT },
  };
}

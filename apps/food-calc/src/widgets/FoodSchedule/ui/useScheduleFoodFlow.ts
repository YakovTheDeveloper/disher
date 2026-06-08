import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { addScheduleFood, updateScheduleFood } from '@/entities/schedule-food';
import { createProduct, setProductNutrients, useProductPortions } from '@/entities/product';
import { createDish, useDishPortions } from '@/entities/dish';
import { persistCustomTagsFromDetails } from '@/features/food/details-chips';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';
import toaster from '@/shared/lib/toaster/toaster';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';

export const SCHEDULE_FOOD_INPUT_IDS = {
  // create
  SEARCH_INPUT: 'search',
  DETAILS_INPUT: 'details-input',
  CREATE_INPUT: 'create-food-name-input',
  // edit
  SEARCH_EDIT_INPUT: 'search-edit',
  QUANTITY_EDIT_INPUT: 'quantity-input-edit',
  DETAILS_EDIT_INPUT: 'details-input-edit',
  // shared (different IDs so both can coexist in the DOM at once)
  TIME_CREATE_INPUT: 'time-input-schedule-food',
  TIME_EDIT_INPUT: 'time-input-edit-schedule-food',
  QUANTITY_CREATE_INPUT: 'quantity-input',
} as const;

export type Step = 'idle' | 'time' | 'search' | 'quantity' | 'details' | 'create';
type ActiveStep = Exclude<Step, 'idle'>;

// Full flow (4 steps) — used when the selected product has either a curated
// suggestion list or saved custom tags, so the details step is worth visiting.
export const CREATE_STEPS_WITH_DETAILS: ActiveStep[] = ['search', 'time', 'quantity', 'details'];
// Compact flow (3 steps) — used when there's nothing to put on a chip-row.
// Details is reachable via an opt-in "+ деталь" link on the quantity step.
export const CREATE_STEPS_NO_DETAILS: ActiveStep[] = ['search', 'time', 'quantity'];
// Backwards-compatible export (any external import still resolves to the full flow).
export const CREATE_STEPS = CREATE_STEPS_WITH_DETAILS;
export const STEP_LABELS: Record<ActiveStep, string> = {
  time: 'Время',
  search: 'Еда',
  quantity: 'Порция',
  details: 'Особенности',
  create: 'Создать',
};

export type DraftState = {
  time: string;
  variant: 'product' | 'dish' | null;
  productId: string | null;
  dishId: string | null;
  foodName: string | null;
  quantity: number;
  details: string;
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
});

const draftFromItem = (item: ScheduleFoodWithRelations): DraftState => ({
  time: item.time,
  variant: item.type === 'food' ? 'product' : 'dish',
  productId: item.type === 'food' ? (item.productId ?? null) : null,
  dishId: item.type === 'dish' ? (item.dishId ?? null) : null,
  foodName: item.product?.name ?? item.dish?.name ?? null,
  quantity: item.quantity,
  details: item.details ?? '',
});

type CreateMode = {
  type: 'create';
  scheduleId: string;
};

type EditMode = {
  type: 'edit';
};

export type FlowMode = CreateMode | EditMode;

export type ScheduleFoodFlow = ReturnType<typeof useScheduleFoodFlow>;

export function useScheduleFoodFlow(mode: FlowMode) {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(() => createEmptyDraft());
  const [editingItem, setEditingItem] = useState<ScheduleFoodWithRelations | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  // Шаги, посещённые в текущей сессии флоу. Накапливается при смене `step`,
  // обнуляется при возврате в 'idle' (т.е. при любом закрытии/коммите) —
  // следующая сессия стартует с чистой историей. Breadcrumbs `results`-вид
  // показывает крошку только для посещённого шага.
  const [visitedSteps, setVisitedSteps] = useState<ActiveStep[]>([]);

  useSwipeableLock(step !== 'idle');

  useEffect(() => {
    if (step === 'idle') {
      setVisitedSteps((prev) => (prev.length ? [] : prev));
      return;
    }
    setVisitedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, [step]);

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

  const CREATE_INPUT = SCHEDULE_FOOD_INPUT_IDS.CREATE_INPUT;

  const INPUT_TO_STEP: Record<string, ActiveStep> = {
    [TIME_INPUT]: 'time',
    [SEARCH_INPUT]: 'search',
    [QUANTITY_INPUT]: 'quantity',
    [DETAILS_INPUT]: 'details',
    // CREATE_INPUT only exists in create mode — edit flow never touches it.
    ...(mode.type === 'create' ? { [CREATE_INPUT]: 'create' as ActiveStep } : {}),
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const nextStep = INPUT_TO_STEP[target.id];
    if (!nextStep) return;

    setStep((prev) => {
      if (prev === 'idle' && mode.type === 'create') setDraft(createEmptyDraft());
      return nextStep;
    });
  }, []);

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

  const startEdit = useCallback(
    (item: ScheduleFoodWithRelations, nextStep: ActiveStep) => {
      setEditingItem(item);
      setDraft(draftFromItem(item));
      setStep(nextStep);
    },
    []
  );

  // Prime editing state without changing step. Used when a <label htmlFor>
  // delegates focus to the edit-search input — onFocusCapture will then
  // flip step to 'search' on its own. Keeping the step transition in the
  // focus handler is what lets iOS Safari actually pop the keyboard.
  const primeEdit = useCallback((item: ScheduleFoodWithRelations) => {
    setEditingItem(item);
    setDraft(draftFromItem(item));
  }, []);

  useOverlayHistory(step !== 'idle', handleClose);

  // Шаг 'time' переключается на 'quantity' ТОЛЬКО кликом по нижней кнопке
  // подтверждения (она = `<label htmlFor={QUANTITY_INPUT}>`, фокус ловит
  // onFocusCapture). Изменения часов/минут/«Сейчас»/native blur просто
  // обновляют draft, не двигают флоу.
  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  };

  // Stash the chosen variant + proposed name in the draft when the user clicks
  // a "Нет нужного…" label inside SearchFood. The step transition to 'create'
  // happens via onFocusCapture once the label delegates focus to CREATE_INPUT.
  const handlePickCreate = useCallback(
    (variant: 'product' | 'dish', name: string) => {
      setDraft((d) => ({
        ...d,
        variant,
        productId: null,
        dishId: null,
        foodName: name,
      }));
    },
    [],
  );

  // Confirm the create-name step: optimistically stamp a UUID into draft so the
  // subsequent quantity step has a stable id, then fire-and-forget the Dexie
  // write. setStep is NOT called here — the confirm element is a <label
  // htmlFor={TIME_INPUT}> and onFocusCapture flips step→'time' once the
  // browser's default action lands focus. Doing setStep synchronously here
  // would unmount this modal before the native event finishes bubbling and
  // kill the focus delegation (see CLAUDE.md "Label focus delegation").
  const handleConfirmCreate = useCallback(
    (
      name: string,
      opts?: { isSupplement?: boolean; nutrients?: Record<string, number> },
    ) => {
      if (mode.type !== 'create') return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const variant = draft.variant;
      if (variant !== 'product' && variant !== 'dish') return;
      const id = crypto.randomUUID();
      setDraft((d) => ({
        ...d,
        variant,
        productId: variant === 'product' ? id : null,
        dishId: variant === 'dish' ? id : null,
        foodName: trimmed,
        // БАД считается per-serving (1 = одна капсула/таблетка). Дефолт 100
        // в createEmptyDraft рассчитан на еду (граммы) и для supplement даёт
        // абсурдные числа в дневной сводке (basis='serving' умножает напрямую).
        quantity: opts?.isSupplement ? 1 : d.quantity,
      }));
      // Rollback the flow if the Dexie write fails (quota / IDB locked). Otherwise
      // draft.productId would point to a non-existent row and a downstream
      // handleCommit could write an orphan schedule_food. Toaster surfaces the
      // error via safeMutate; we just unwind to 'idle'.
      const rollback = () => {
        setStep('idle');
        setDraft(createEmptyDraft());
        setSessionKey((k) => k + 1);
      };
      const errorMsg =
        variant === 'product' ? 'Не удалось создать продукт' : 'Не удалось создать блюдо';
      const mutation =
        variant === 'product'
          ? () => createProduct({ id, name: trimmed, isSupplement: opts?.isSupplement })
          : () => createDish(trimmed, id);
      void safeMutate(mutation, errorMsg).then((res) => {
        if (!res.ok) {
          rollback();
          return;
        }
        // Для БАД — записываем введённые в модалке нутриенты (per 1 шт).
        // Best-effort: ошибку покажет setProductNutrients через toaster,
        // продукт уже создан, флоу не откатываем.
        const n = opts?.nutrients;
        if (variant === 'product' && n && Object.keys(n).length > 0) {
          void safeMutate(
            () => setProductNutrients(id, JSON.stringify(n)),
            'Не удалось сохранить нутриенты',
          );
        }
      });
    },
    [draft.variant, mode],
  );

  const handleFoodSelect = async (payload: { variant: 'product' | 'dish'; id: string; name: string }) => {
    if (mode.type === 'create') {
      setDraft((prev) => ({
        ...prev,
        variant: payload.variant,
        productId: payload.variant === 'product' ? payload.id : null,
        dishId: payload.variant === 'dish' ? payload.id : null,
        foodName: payload.name,
      }));
      // step переключит onFocusCapture после того, как <label htmlFor={TIME_INPUT}>
      // передаст фокус. Синхронный setStep здесь размонтировал бы SearchFoodHeavy
      // до того, как браузер обработает дефолт лейбла → фокус терялся.
    } else {
      if (!editingItem) return;
      const detailsValue = draft.details.trim() || null;
      const productIdForCustom = payload.variant === 'product' ? payload.id : null;
      const result = await safeMutate(
        () =>
          updateScheduleFood(editingItem.id, {
            time: draft.time,
            type: payload.variant === 'product' ? 'food' : 'dish',
            productId: payload.variant === 'product' ? payload.id : null,
            dishId: payload.variant === 'dish' ? payload.id : null,
            quantity: draft.quantity,
            details: detailsValue,
          }),
        'Не удалось обновить'
      );
      if (!result.ok) return;
      void persistCustomTagsFromDetails(productIdForCustom, detailsValue);
      setStep('idle');
      setEditingItem(null);
      setDraft(createEmptyDraft());
    }
  };

  const handleCommit = async () => {
    if (mode.type === 'create') {
      const canCommit = draft.variant && (draft.productId || draft.dishId);
      const snapshot = canCommit
        ? {
          date: mode.scheduleId,
          time: draft.time,
          type: (draft.variant === 'product' ? 'food' : 'dish') as 'food' | 'dish',
          productId: draft.productId,
          dishId: draft.dishId,
          quantity: draft.quantity,
          details: draft.details.trim() || null,
        }
        : null;

      // Закрываем модалку сразу — мутация уходит в фон.
      setStep('idle');
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);

      if (snapshot) {
        void safeMutate(() => addScheduleFood(snapshot), 'Не удалось добавить в расписание')
          .then((res) => {
            if (!res.ok) return;
            const newId = res.value;
            void persistCustomTagsFromDetails(snapshot.productId, snapshot.details);
            toaster.success('Добавлено в расписание');
            useRecentlyAddedStore.getState().addMany([newId]);
            requestAnimationFrame(() => {
              setTimeout(() => {
                const el = document.querySelector(`[data-schedule-food-id="${newId}"]`);
                if (el) {
                  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
              }, 150);
            });
          });
      }
    } else {
      const canCommit = editingItem && draft.variant && (draft.productId || draft.dishId);
      const editSnapshot = canCommit && editingItem
        ? {
          id: editingItem.id,
          patch: {
            time: draft.time,
            type: (draft.variant === 'product' ? 'food' : 'dish') as 'food' | 'dish',
            productId: draft.variant === 'product' ? draft.productId : null,
            dishId: draft.variant === 'dish' ? draft.dishId : null,
            quantity: draft.quantity,
            details: draft.details.trim() || null,
          },
        }
        : null;

      setStep('idle');
      setEditingItem(null);
      setDraft(createEmptyDraft());

      if (editSnapshot) {
        void safeMutate(
          () => updateScheduleFood(editSnapshot.id, editSnapshot.patch),
          'Не удалось обновить'
        ).then((res) => {
          if (!res.ok) return;
          void persistCustomTagsFromDetails(
            editSnapshot.patch.productId,
            editSnapshot.patch.details,
          );
        });
      }
    }
  };

  const updateQuantity = useCallback(
    (q: number) => setDraft((d) => ({ ...d, quantity: q })),
    [],
  );

  const quantityContent = useMemo(
    () => ({
      quantity: draft.quantity,
      updateQuantity,
      product: draft.variant === 'product' ? { portions: foodPortions ?? [] } : undefined,
      dish: draft.variant === 'dish' ? { portions: dishPortions ?? [] } : undefined,
    }),
    [draft.quantity, draft.variant, updateQuantity, foodPortions, dishPortions],
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
    handleTimeFinish,
    handleFoodSelect,
    handlePickCreate,
    handleConfirmCreate,
    handleCommit,
    quantityContent,
    inputIds: { TIME_INPUT, SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT, CREATE_INPUT },
  };
}

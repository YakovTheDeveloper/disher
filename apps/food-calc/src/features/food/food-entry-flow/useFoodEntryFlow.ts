import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { addScheduleFood, updateScheduleFood } from '@/entities/schedule-food';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { addDishItem, updateDishItem, createDish, useDishPortions } from '@/entities/dish';
import { createProduct, setProductNutrients, useProductPortions, useProducts } from '@/entities/product';
import { getQtyUnit } from '@/shared/lib/servingUnit';
import { persistCustomTagsFromDetails } from '@/features/food/details-chips';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';
import { foodEntryInputIds, type FoodEntryKind } from './inputIds';
import { scrollToNewRow } from './scrollToNewRow';
import { markAdded } from '@/shared/model/recentlyAddedStore';
import { useHaptic } from '@/shared/lib/hooks/useHaptic';

// ── Цель флоу ────────────────────────────────────────────────────────────────
// Единственное доменное расхождение еды в расписании и ингредиента блюда — в
// какую таблицу пишем. Дискриминированный union делает это явным; узкий
// switch(target.kind) живёт только на entity-write (commit/select), всё
// остальное общее.
export type FoodEntryTarget =
  | { kind: 'schedule'; date: string }
  | { kind: 'dish'; dishId: string };

export type FoodEntryMode = 'create' | 'edit';

export type Step = 'idle' | 'time' | 'search' | 'quantity' | 'details' | 'create';
type ActiveStep = Exclude<Step, 'idle'>;

// Полный флоу (3 шага) — когда у выбранного продукта есть курируемые подсказки
// или сохранённые кастом-теги (шаг деталей стоит посетить). Шаг 'time' в
// create отсутствует — время = «сейчас» (штампуется на коммите); 'time' живёт
// только в edit-флоу расписания.
export const CREATE_STEPS_WITH_DETAILS: ActiveStep[] = ['search', 'quantity', 'details'];
// Компактный флоу (2 шага) — когда на чип-ряд нечего класть. Детали доступны
// через опт-ин «+ деталь» на шаге количества.
export const CREATE_STEPS_NO_DETAILS: ActiveStep[] = ['search', 'quantity'];
export const STEP_LABELS: Record<ActiveStep, string> = {
  time: 'Время',
  search: 'Еда',
  quantity: 'Порция',
  details: 'Особенности',
  create: 'Создать',
};

export type DraftState = {
  /** Только расписание (edit). У блюда не используется. */
  time: string;
  /** У блюда всегда 'product' (блюдо в блюдо не вкладывается). */
  variant: 'product' | 'dish';
  productId: string | null;
  /** Только расписание (вариант 'dish'). */
  dishId: string | null;
  foodName: string | null;
  quantity: number;
  details: string;
};

// Строки редактирования: расписание отдаёт ScheduleFoodWithRelations, блюдо —
// плоский ингредиент. draftFromItem разруливает по target.kind.
export type ScheduleEditItem = ScheduleFoodWithRelations;
export type DishEditItem = {
  id: string;
  productId: string;
  quantity: number;
  details?: string;
  product?: { name: string | null } | null;
};
export type FoodEntryEditItem = ScheduleEditItem | DishEditItem;

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

const draftFromItem = (item: FoodEntryEditItem, kind: FoodEntryKind): DraftState => {
  if (kind === 'schedule') {
    const it = item as ScheduleEditItem;
    return {
      time: it.time,
      variant: it.type === 'food' ? 'product' : 'dish',
      productId: it.type === 'food' ? (it.productId ?? null) : null,
      dishId: it.type === 'dish' ? (it.dishId ?? null) : null,
      foodName: it.product?.name ?? it.dish?.name ?? null,
      quantity: it.quantity,
      details: it.details ?? '',
    };
  }
  const it = item as DishEditItem;
  return {
    time: '',
    variant: 'product',
    productId: it.productId,
    dishId: null,
    foodName: it.product?.name ?? null,
    quantity: it.quantity,
    details: it.details ?? '',
  };
};

export type FoodEntryFlow = ReturnType<typeof useFoodEntryFlow>;

export function useFoodEntryFlow({
  mode,
  target,
}: {
  mode: FoodEntryMode;
  target: FoodEntryTarget;
}) {
  const kind = target.kind;
  const haptic = useHaptic();
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(() => createEmptyDraft());
  const [editingItem, setEditingItem] = useState<FoodEntryEditItem | null>(null);
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

  // Все продукты (каталог + user) — уже загружены к моменту выбора из поиска.
  // Нужны, чтобы синхронно (на клике по карточке) узнать basis/serving-unit
  // выбранного продукта: БАД (servingBasis='serving') считается в дозах, поэтому
  // его дефолт-количество = 1, а не 100 г, а юнит шага = «шт», не «г».
  const allProducts = useProducts();
  const selectedProduct = useMemo(
    () =>
      draft.variant === 'product' && draft.productId
        ? (allProducts.find((p) => p.id === draft.productId) ?? null)
        : null,
    [allProducts, draft.variant, draft.productId],
  );

  const foodPortions = useProductPortions(
    draft.variant === 'product' ? (draft.productId ?? undefined) : undefined,
  );
  const dishPortions = useDishPortions(
    draft.variant === 'dish' ? (draft.dishId ?? undefined) : undefined,
  );

  const inputIds = useMemo(() => foodEntryInputIds(kind)[mode], [kind, mode]);
  const { SEARCH_INPUT, QUANTITY_INPUT, DETAILS_INPUT, CREATE_INPUT, TIME_INPUT } = inputIds;

  const INPUT_TO_STEP: Record<string, ActiveStep> = {
    [SEARCH_INPUT]: 'search',
    [QUANTITY_INPUT]: 'quantity',
    [DETAILS_INPUT]: 'details',
    // CREATE_INPUT валиден только в create-режиме; TIME_INPUT — только в edit.
    // Лишний ключ безвреден: соответствующий инпут в DOM не рендерится.
    ...(mode === 'create'
      ? { [CREATE_INPUT]: 'create' as ActiveStep }
      : { [TIME_INPUT]: 'time' as ActiveStep }),
  };

  const handleFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const targetEl = e.target as HTMLElement;
      const nextStep = INPUT_TO_STEP[targetEl.id];
      if (!nextStep) return;

      setStep((prev) => {
        if (prev === 'idle' && mode === 'create') setDraft(createEmptyDraft());
        return nextStep;
      });

      // Центрируем сфокусированное поле (узкие вьюпорты / iOS).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          targetEl.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        });
      });
    },
    [],
  );

  const handleClose = () => {
    if (mode === 'create') {
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);
    } else {
      setEditingItem(null);
      setDraft(createEmptyDraft());
    }
    setStep('idle');
  };

  const startEdit = useCallback(
    (item: FoodEntryEditItem, nextStep: ActiveStep) => {
      setEditingItem(item);
      setDraft(draftFromItem(item, kind));
      setStep(nextStep);
    },
    [kind],
  );

  // Prime editing state без смены шага. Используется, когда `<label htmlFor>`
  // делегирует фокус edit-инпуту — onFocusCapture сам флипнет шаг на том же
  // focus-событии (так iOS Safari надёжно поднимает клавиатуру).
  const primeEdit = useCallback(
    (item: FoodEntryEditItem) => {
      setEditingItem(item);
      setDraft(draftFromItem(item, kind));
    },
    [kind],
  );

  useOverlayHistory(step !== 'idle', handleClose);

  // Шаг 'time' (edit расписания) переключается на коммит ТОЛЬКО кликом по
  // нижней кнопке; правки часов просто обновляют draft.
  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  };

  // Stash вариант + предложенное имя в draft при клике «Нет нужного…» внутри
  // SearchFood. Переход на 'create' делает onFocusCapture после делегирования
  // фокуса CREATE_INPUT. У блюда вариант всегда product.
  const handlePickCreate = useCallback(
    (variant: 'product' | 'dish', name: string) => {
      if (kind === 'dish' && variant !== 'product') return;
      setDraft((d) => ({
        ...d,
        variant,
        productId: null,
        dishId: null,
        foodName: name,
      }));
    },
    [kind],
  );

  // Подтверждение шага создания имени: оптимистично штампуем UUID в draft, потом
  // fire-and-forget пишем в Dexie. setStep здесь НЕ зовём — confirm рендерится
  // как `<label htmlFor={QUANTITY_INPUT}>`, onFocusCapture флипнет шаг после
  // делегирования фокуса (CLAUDE.md «Label focus delegation»). БАД-нутриенты
  // (per 1 шт) пишутся для product-варианта на обоих таргетах.
  const handleConfirmCreate = useCallback(
    (
      name: string,
      opts?: { isSupplement?: boolean; nutrients?: Record<string, number> },
    ) => {
      if (mode !== 'create') return;
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
        // БАД считается per-serving (1 = одна капсула/таблетка). Дефолт 100 в
        // createEmptyDraft рассчитан на еду (граммы) — для supplement даёт абсурд.
        quantity: opts?.isSupplement ? 1 : d.quantity,
      }));
      // Откат флоу, если запись в Dexie упала (quota / IDB locked) — иначе
      // draft.productId укажет на несуществующую строку и handleCommit запишет
      // orphan. safeMutate покажет ошибку тостером, мы просто разматываем в idle.
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

  const handleFoodSelect = async (payload: {
    variant: 'product' | 'dish';
    id: string;
    name?: string;
  }) => {
    // Блюдо в блюдо не вкладывается (searchMode='products-only' это уже
    // предотвращает, но гард на месте на всякий случай).
    if (kind === 'dish' && payload.variant === 'dish') return;

    if (mode === 'create') {
      // Дефолт количества зависит от basis выбранного продукта: БАД (serving)
      // считается в дозах → 1; еда/блюдо → 100 г. allProducts уже в памяти (это
      // те же строки, что показал поиск), поэтому basis резолвится синхронно на
      // клике — новая порция-дефолт попадает в draft ДО того, как ProductQuantity
      // ре-синкнет своё значение по resetKey (гонки нет).
      const selected =
        payload.variant === 'product'
          ? allProducts.find((p) => p.id === payload.id)
          : undefined;
      const defaultQty = selected?.servingBasis === 'serving' ? 1 : 100;
      // Только пишем draft — НЕ зовём setStep. Переход на 'quantity' делает
      // делегирование фокуса (карточка SearchFood = `<label htmlFor=
      // {QUANTITY_INPUT}>`). Синхронный setStep размонтировал бы SearchFood до
      // делегирования (CLAUDE.md «Label focus delegation»).
      setDraft((prev) => ({
        ...prev,
        variant: payload.variant,
        productId: payload.variant === 'product' ? payload.id : null,
        dishId: payload.variant === 'dish' ? payload.id : null,
        foodName: payload.name ?? null,
        quantity: defaultQty,
      }));
      return;
    }

    // edit: смена самой еды коммитится сразу.
    if (!editingItem) return;
    if (kind === 'schedule') {
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
        'Не удалось обновить',
      );
      if (!result.ok) return;
      void persistCustomTagsFromDetails(productIdForCustom, detailsValue);
    } else {
      const result = await safeMutate(
        () => updateDishItem(editingItem.id, { productId: payload.id }),
        'Не удалось обновить',
      );
      if (!result.ok) return;
    }
    setStep('idle');
    setEditingItem(null);
    setDraft(createEmptyDraft());
  };

  const handleCommit = async () => {
    if (mode === 'create') {
      const canCommit = draft.variant && (draft.productId || draft.dishId);
      const details = draft.details.trim() || null;
      // Закрываем модалку сразу — мутация уходит в фон (паритет обоих таргетов).
      const productIdForCustom = draft.productId;
      setStep('idle');
      setDraft(createEmptyDraft());
      setSessionKey((k) => k + 1);
      if (!canCommit) return;

      if (target.kind === 'schedule') {
        const snapshot = {
          date: target.date,
          // Время = «сейчас» (на момент коммита); edit правит время отдельно.
          time: new Date().toTimeString().slice(0, 5),
          type: (draft.variant === 'product' ? 'food' : 'dish') as 'food' | 'dish',
          productId: draft.productId,
          dishId: draft.dishId,
          quantity: draft.quantity,
          details,
        };
        // ВАЖНО: помечаем ряд «только что добавлен» ДО записи. addScheduleFood на
        // коммите тригерит liveQuery, который монтирует новый ряд; если пометить
        // ПОСЛЕ await (как было), ряд успевает смонтироваться раньше флага → читает
        // isJustAdded=false → играет быстрый 320ms stagger вместо появления. Поэтому
        // генерим id заранее, markAdded, и передаём id в запись.
        const newId = crypto.randomUUID();
        markAdded([newId]);
        void safeMutate(
          () => addScheduleFood({ ...snapshot, id: newId }),
          'Не удалось добавить в расписание',
        ).then((res) => {
          if (!res.ok) return;
          void persistCustomTagsFromDetails(productIdForCustom, details);
          // Тост «Добавлено в расписание» убран (по запросу) — создание сущности
          // расписания больше не уведомляет. Haptic + подскролл остаются.
          haptic();
          scrollToNewRow(res.value);
        });
      } else {
        const dishId = target.dishId;
        const productId = draft.productId;
        if (!productId) return;
        // Паритет с расписанием: помечаем ДО записи (иначе ряд монтируется на
        // коммите раньше флага — см. schedule-ветку выше).
        const newDishItemId = crypto.randomUUID();
        markAdded([newDishItemId]);
        void safeMutate(
          () =>
            addDishItem({
              dishId,
              productId,
              quantity: draft.quantity,
              details: details ?? '',
              id: newDishItemId,
            }),
          'Не удалось добавить продукт',
        ).then((res) => {
          if (!res.ok) return;
          void persistCustomTagsFromDetails(productId, details ?? '');
          toaster.success('Продукт добавлен');
          scrollToNewRow(res.value);
        });
      }
      return;
    }

    // edit
    const canCommit = editingItem && draft.variant && (draft.productId || draft.dishId);
    const item = editingItem;
    const details = draft.details.trim() || null;
    setStep('idle');
    setEditingItem(null);
    setDraft(createEmptyDraft());
    if (!canCommit || !item) return;

    if (target.kind === 'schedule') {
      const patch = {
        time: draft.time,
        type: (draft.variant === 'product' ? 'food' : 'dish') as 'food' | 'dish',
        productId: draft.variant === 'product' ? draft.productId : null,
        dishId: draft.variant === 'dish' ? draft.dishId : null,
        quantity: draft.quantity,
        details,
      };
      void safeMutate(() => updateScheduleFood(item.id, patch), 'Не удалось обновить').then(
        (res) => {
          if (!res.ok) return;
          void persistCustomTagsFromDetails(patch.productId, details);
        },
      );
    } else {
      const productId = draft.productId ?? undefined;
      const productIdForCustom = draft.productId ?? (item as DishEditItem).productId;
      void safeMutate(
        () => updateDishItem(item.id, { productId, quantity: draft.quantity, details: details ?? '' }),
        'Не удалось обновить',
      ).then((res) => {
        if (!res.ok) return;
        void persistCustomTagsFromDetails(productIdForCustom, details ?? '');
      });
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
      // Юнит шага количества: еда/блюдо → «г», БАД → его servingUnit («шт»/…).
      unit: draft.variant === 'product' ? getQtyUnit(selectedProduct) : 'г',
      product: draft.variant === 'product' ? { portions: foodPortions ?? [] } : undefined,
      dish: draft.variant === 'dish' ? { portions: dishPortions ?? [] } : undefined,
    }),
    [draft.quantity, draft.variant, updateQuantity, foodPortions, dishPortions, selectedProduct],
  );

  return {
    kind,
    // Дата дня расписания (dd-MM-yyyy) — для заголовка «Добавить еду в dd.mm».
    // У блюда даты нет (undefined).
    date: target.kind === 'schedule' ? target.date : undefined,
    mode,
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
    inputIds,
  };
}

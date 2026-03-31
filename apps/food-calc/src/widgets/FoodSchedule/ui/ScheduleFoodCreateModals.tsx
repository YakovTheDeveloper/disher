import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@livestore/react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter, NextStepButton } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { addScheduleFood } from '@/entities/schedule-food';
import { useProductPortions } from '@/entities/product';
import { useDishPortions } from '@/entities/dish';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { highlightListItem } from '@/shared/lib/emitter/emitter';
import Button from '@/shared/ui/atoms/Button/Button';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';

import EditIcon from '@/shared/assets/icons/edit.svg';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import type { Portion } from '@/features/product/ProductQuantity';

/**
 * Input IDs used for label→input focus delegation across all FoodSchedule modals.
 *
 * Each modal step is opened by a <label htmlFor={ID}> that focuses the corresponding <input id={ID}>.
 * The onFocusCapture handler reads e.target.id to determine which step is active.
 *
 * ScheduleFoodCreateModals (this file):
 *   - SEARCH_INPUT  → SearchFood input (step: search)
 *   - TIME_INPUT    → TimeChoose input (step: time)
 *   - QUANTITY_INPUT → ProductQuantity NumberInput (step: quantity)
 */
export const MODAL_INPUT_IDS = {
  TIME_INPUT: 'time-input-schedule-food',
  SEARCH_INPUT: 'search',
  QUANTITY_INPUT: 'quantity-input',
  DETAILS_INPUT: 'details-input',
} as const;

type Step = 'idle' | 'time' | 'search' | 'quantity' | 'details';
type ActiveStep = Exclude<Step, 'idle'>;

const STEPS: ActiveStep[] = ['search', 'time', 'quantity'];

const STEP_LABELS: Record<ActiveStep, string> = {
  time: 'Время',
  search: 'Продукт',
  quantity: 'Количество',
  details: 'Заметка',
};

type FoodContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
};

type DraftState = {
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

type Props = {
  scheduleId: string;
  richNutrient?: { id: string; unit: string } | null;
  onRichNutrientClear?: () => void;
};

const mapPortions = (
  results: readonly { readonly label: string; readonly amount: number; readonly unit: string; readonly grams: number }[] | undefined
): Portion[] =>
  results ? results.map(({ label, amount, unit, grams }) => ({ label, amount, unit, grams })) : [];

const ScheduleFoodCreateModals = ({ scheduleId, richNutrient, onRichNutrientClear }: Props) => {
  const { store } = useStore();
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft);
  const [sessionKey, setSessionKey] = useState(0);
  const { toProduct, toDish } = useAppRoutes();
  useSwipeableLock(step !== 'idle');

  // Auto-open search when richNutrient is set externally
  useEffect(() => {
    if (richNutrient && step === 'idle') {
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

  const INPUT_TO_STEP: Record<string, ActiveStep> = {
    [MODAL_INPUT_IDS.TIME_INPUT]: 'time',
    [MODAL_INPUT_IDS.SEARCH_INPUT]: 'search',
    [MODAL_INPUT_IDS.QUANTITY_INPUT]: 'quantity',
    [MODAL_INPUT_IDS.DETAILS_INPUT]: 'details',
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const nextStep = INPUT_TO_STEP[target.id];
    if (!nextStep) return;

    setStep((prev) => {
      if (prev === 'idle') setDraft(createEmptyDraft());
      return nextStep;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  };

  const handleFoodSelect = (payload: { variant: 'product' | 'dish'; id: string; name: string }) => {
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
  };

  const handleCommit = () => {
    if (draft.variant && (draft.productId || draft.dishId)) {
      const newId = safeMutate(
        () => addScheduleFood(store, {
          date: scheduleId,
          time: draft.time,
          type: draft.variant === 'product' ? 'food' : 'dish',
          foodId: draft.productId,
          dishId: draft.dishId,
          quantity: draft.quantity,
          details: draft.details.trim() || null,
        }),
        'Не удалось добавить в расписание',
      );
      if (newId === undefined) return;
      toaster.success('Добавлено в расписание');

      // Scroll to & highlight the newly added item after it renders
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
    setStep('idle');
    onRichNutrientClear?.();
  };

  const handleClose = () => {
    setDraft(createEmptyDraft());
    setSessionKey((k) => k + 1);
    setStep('idle');
    onRichNutrientClear?.();
  };

  useOverlayHistory(step !== 'idle', handleClose);

  const goToStep = (target: Step) => {
    setStep(target);
  };

  const quantityContent = {
    ...(draft.content ?? {
      quantity: draft.quantity,
      updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })),
    }),
    food: draft.variant === 'product' ? { portions: mapPortions(foodPortions) } : undefined,
    dish: draft.variant === 'dish' ? { portions: mapPortions(dishPortions) } : undefined,
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Search Food — trigger: <label htmlFor={MODAL_INPUT_IDS.SEARCH_INPUT}> */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <SearchFood
            onInfoClick={(variant, id) => {
              const isProduct = variant === 'product';
              handleClose();
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (isProduct) toProduct(id);
                  else toDish(id);
                });
              });
            }}
            searchBarRightChild={
              <label
                htmlFor={MODAL_INPUT_IDS.DETAILS_INPUT}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  cursor: 'pointer',
                  color: draft.details ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.25)',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Заметка"
              >
                <EditIcon />
              </label>
            }
            key={sessionKey}
            mode="products-and-dishes"
            richNutrient={richNutrient}
            onSelectFood={handleFoodSelect}
            onBack={handleClose}
            activeItemId={draft.productId ?? draft.dishId ?? undefined}
            itemHtmlFor={MODAL_INPUT_IDS.TIME_INPUT}
            inputId={MODAL_INPUT_IDS.SEARCH_INPUT}
          />
        }
      />

      {/* Step 2: Time — trigger: food selection → setStep('time') */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="time"
              steps={STEPS}
              stepLabels={STEP_LABELS}
              stepResults={{ time: draft.time, search: draft.foodName ?? undefined }}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.Spacer />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={MODAL_INPUT_IDS.TIME_INPUT}
                nextLabelHtmlFor={MODAL_INPUT_IDS.QUANTITY_INPUT}
              />
              <ModalFooter onBack={() => goToStep('search')}>
                <NextStepButton htmlFor={MODAL_INPUT_IDS.QUANTITY_INPUT} />
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 3: Quantity — trigger: handleFoodSelect → setStep('quantity') */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="quantity"
              steps={STEPS}
              stepLabels={STEP_LABELS}
              stepResults={{ time: draft.time, search: draft.foodName ?? undefined }}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.Spacer />
            <ModalShell.Body>
              {(draft.productId || draft.dishId) && (
                <ProductQuantity
                  key={sessionKey}
                  content={quantityContent}
                  onFinish={() => {}}
                  onNextButtonClick={handleCommit}
                />
              )}
              <ModalFooter onBack={() => goToStep('time')}>
                <Button variant="primary-form" onClick={handleCommit}>
                  Готово
                </Button>
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Optional: Details — trigger: <label htmlFor={DETAILS_INPUT}> in searchBarRightChild */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'details'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="details"
              steps={['details']}
              stepLabels={STEP_LABELS}
              stepResults={{}}
              onBack={() => goToStep('search')}
              onStepClick={goToStep}
            />
            <ModalShell.Spacer />
            <ModalShell.Body>
              <Textarea
                id={MODAL_INPUT_IDS.DETAILS_INPUT}
                value={draft.details}
                onChange={(value) => setDraft((d) => ({ ...d, details: value }))}
                placeholder="Заметка к записи..."
                rows={3}
                maxLength={500}
              />
              <ModalFooter onBack={() => goToStep('search')}>
                <Button variant="primary-form" onClick={() => goToStep('search')}>
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

export default ScheduleFoodCreateModals;

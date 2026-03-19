import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import clsx from 'clsx';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';
import { addDishItem } from '@/entities/dish';
import toaster from '@/infrastructure/toaster/toaster';
import Button from '@/components/ui/atoms/Button/Button';
import s from '@/components/widgets/FoodSchedule/ui/FoodScheduleModals.module.scss';

export const DISH_MODAL_INPUT_IDS = {
  SEARCH_INPUT: 'dish-item-search',
  QUANTITY_INPUT: 'dish-item-quantity',
} as const;

type Step = 'idle' | 'search' | 'quantity';

const STEPS: Step[] = ['search', 'quantity'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  search: 'Продукт',
  quantity: 'Количество',
};

type FoodContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
};

type DraftState = {
  foodId: string | null;
  quantity: number;
  content: FoodContent | null;
};

const createEmptyDraft = (): DraftState => ({
  foodId: null,
  quantity: 100,
  content: null,
});

type Props = {
  dishId: string;
};

const DishItemCreationModals = ({ dishId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft);
  useSwipeableLock(step !== 'idle');

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === DISH_MODAL_INPUT_IDS.SEARCH_INPUT) setStep('search');
    else if (id === DISH_MODAL_INPUT_IDS.QUANTITY_INPUT) setStep('quantity');
    else return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleFoodSelect = (payload: { variant: 'product' | 'dish'; id: string }) => {
    if (payload.variant === 'dish') return;
    setDraft((prev) => ({
      ...prev,
      foodId: payload.id,
      content: {
        quantity: prev.quantity,
        updateQuantity: (q: number) => setDraft((d) => ({ ...d, quantity: q })),
      },
    }));
    setStep('quantity');
  };

  const handleCommit = async () => {
    if (draft.foodId) {
      await addDishItem({
        dishId,
        foodId: draft.foodId,
        quantity: draft.quantity,
      });
      toaster.success('Продукт добавлен');
    }
    setDraft(createEmptyDraft());
    setStep('idle');
  };

  const handleClose = () => {
    setDraft(createEmptyDraft());
    setStep('idle');
  };

  const goToStep = (target: Step) => {
    setStep(target);
  };

  const Breadcrumbs = ({ current }: { current: Exclude<Step, 'idle'> }) => {
    const currentIndex = STEPS.indexOf(current);

    return (
      <nav className={s.breadcrumbs}>
        {STEPS.map((stepName, i) => {
          if (stepName === 'idle') return null;
          const isCompleted = currentIndex > i;
          const isCurrent = current === stepName;

          return (
            <span key={stepName} className={s.crumbWrapper}>
              {i > 0 && <span className={s.separator}>/</span>}
              <button
                className={clsx(s.crumb, isCompleted && s.completed, isCurrent && s.current)}
                onClick={() => isCompleted && goToStep(stepName)}
                disabled={!isCompleted}
              >
                {STEP_LABELS[stepName as Exclude<Step, 'idle'>]}
              </button>
            </span>
          );
        })}
      </nav>
    );
  };

  const Header = ({ currentStep }: { currentStep: Exclude<Step, 'idle'> }) => (
    <header className={s.header}>
      <button className={s.backButton} onClick={handleClose}>
        ←
      </button>
      <Breadcrumbs current={currentStep} />
    </header>
  );

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Search Food */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'search'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="search" />
            <SearchFood
              mode="products-only"
              onFinish={handleFoodSelect}
              currentProductId={draft.foodId ?? undefined}
              itemHtmlFor={DISH_MODAL_INPUT_IDS.QUANTITY_INPUT}
              inputId={DISH_MODAL_INPUT_IDS.SEARCH_INPUT}
            />
          </div>
        }
      />

      {/* Step 2: Quantity */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'quantity'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="quantity" />
            <div className={s.spacer} />
            <div className={s.content}>
              {draft.content && <ProductQuantity content={draft.content} onFinish={() => {}} />}
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

export default DishItemCreationModals;

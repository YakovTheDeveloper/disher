import { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { EditableList, EditableListRef } from '@/components/features/manage-list/EditableList';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import { copyDishItems } from '@/entities/dish';
import toaster from '@/infrastructure/toaster/toaster';
import { RouterUrls } from '@/router';
import s from '@/components/widgets/FoodSchedule/ui/FoodScheduleModals.module.scss';

export const COPY_TO_DISH_INPUT_IDS = {
  SEARCH_INPUT: 'copy-to-dish-search',
} as const;

type Step = 'idle' | 'selectDish' | 'products';

const STEPS: Step[] = ['selectDish', 'products'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  selectDish: 'Блюдо',
  products: 'Продукты',
};

type DishItemForCopy = {
  id: string;
  foodName: string;
};

type Props = {
  isExpanded: boolean;
  sourceDishId: string;
  items: DishItemForCopy[];
  onFinish: () => void;
  onClose: () => void;
};

const CopyProductsToExistingDishModal = ({ isExpanded, sourceDishId, items, onFinish, onClose }: Props) => {
  const [step, setStep] = useState<Step>('selectDish');
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const editableListRef = useRef<EditableListRef>(null);

  useSwipeableLock(isExpanded);

  const handleClose = () => {
    setStep('selectDish');
    setSelectedDishId(null);
    onClose();
  };

  const goToStep = (target: Step) => {
    setStep(target);
  };

  const handleDishSelect = (payload: { variant: 'product' | 'dish'; id: string }) => {
    setSelectedDishId(payload.id);
    setStep('products');
  };

  const handleConfirm = async () => {
    const selectedIds = editableListRef.current?.getResultedItemsIds();

    if (!selectedIds || selectedIds.asArray.length === 0) {
      toaster.error('Выберите хотя бы 1 продукт');
      return;
    }

    if (!selectedDishId) return;

    await copyDishItems(sourceDishId, selectedDishId, selectedIds.asArray);

    toaster.success('Скопировано в блюдо', {
      action: { label: 'Открыть', href: RouterUrls.getDish(selectedDishId) },
    });
    onFinish();
    setStep('selectDish');
    setSelectedDishId(null);
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === COPY_TO_DISH_INPUT_IDS.SEARCH_INPUT) setStep('selectDish');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

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
      {/* Step 1: Select Dish */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={isExpanded && step === 'selectDish'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="selectDish" />
            <SearchFood
              onFinish={handleDishSelect}
              mode="dishes-only"
              currentDishId={selectedDishId}
              inputId={COPY_TO_DISH_INPUT_IDS.SEARCH_INPUT}
            />
          </div>
        }
      />

      {/* Step 2: Confirm Products */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={isExpanded && step === 'products'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="products" />
            <div className={s.content}>
              <h2>Корректный список?</h2>
              <EditableList
                ref={editableListRef}
                items={items}
                renderItem={(item) => item.foodName}
              />
              <div className={s.finishButton}>
                <button className={s.nextButton} onClick={handleConfirm}>
                  Скопировать
                </button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CopyProductsToExistingDishModal;

import { useCallback, useRef, useState } from 'react';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { EditableList, EditableListRef } from '@/features/manage-list/EditableList';
import { Button } from '@/shared/ui/atoms/Button';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { copyDishItems } from '@/entities/dish';
import toaster from '@/shared/lib/toaster/toaster';
import { RouterUrls } from '@/app/router';
import s from '@/widgets/FoodSchedule/ui/FoodScheduleModals.module.scss';

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

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Select Dish */}
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'selectDish'}
        content={
          <div className={s.wrapper}>
            <ModalStepHeader currentStep="selectDish" steps={STEPS} stepLabels={STEP_LABELS} onBack={handleClose} onStepClick={goToStep} />
            <SearchFood
              onSelectFood={handleDishSelect}
              mode="dishes-only"
              activeItemId={selectedDishId}
              inputId={COPY_TO_DISH_INPUT_IDS.SEARCH_INPUT}
            />
          </div>
        }
      />

      {/* Step 2: Confirm Products */}
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'products'}
        content={
          <div className={s.wrapper}>
            <ModalStepHeader currentStep="products" steps={STEPS} stepLabels={STEP_LABELS} onBack={handleClose} onStepClick={goToStep} />
            <div className={s.content}>
              <h2>Корректный список?</h2>
              <EditableList
                ref={editableListRef}
                items={items}
                renderItem={(item) => item.foodName}
              />
              <div className={s.finishButton}>
                <Button variant="primary-form" onClick={handleConfirm}>
                  Скопировать
                </Button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CopyProductsToExistingDishModal;

import { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { SearchFood } from '@/features/food/food-search';
import { EditableList, EditableListRef } from '@/features/manage-list/EditableList';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import toaster from '@/shared/lib/toaster/toaster';
import { RouterUrls } from '@/router';
import { scheduleFoodsToDishItems } from '@/entities/schedule-food';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { MODAL_INPUT_IDS } from '../ScheduleFoodCreationModals';
import s from '../FoodScheduleModals.module.scss';

type Step = 'idle' | 'selectDish' | 'products';

const STEPS: Step[] = ['selectDish', 'products'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  selectDish: 'Блюдо',
  products: 'Продукты',
};

type Props = {
  isExpanded: boolean;
  selectedIds: string[];
  items: ScheduleFoodWithRelations[];
  onFinish: () => void;
  onClose: () => void;
};

const CopyToExistingDishModal = ({ isExpanded, selectedIds, items, onFinish, onClose }: Props) => {
  const [step, setStep] = useState<Step>('selectDish');
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const editableListRef = useRef<EditableListRef>(null);

  useSwipeableLock(isExpanded);

  const foodItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id) && item.foodId != null),
    [items, selectedIds],
  );

  const adaptedItems = useMemo(
    () => foodItems.map((item) => ({
      id: item.id,
      contentProduct: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (item as any).food?.name ?? '—',
        foodId: item.foodId,
        quantity: item.quantity,
      },
    })),
    [foodItems],
  );

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
    const resultIds = editableListRef.current?.getResultedItemsIds();

    if (!resultIds || resultIds.asArray.length === 0) {
      toaster.error('Выберите хотя бы 1 продукт');
      return;
    }

    if (!selectedDishId) return;

    await scheduleFoodsToDishItems(resultIds.asArray, selectedDishId);

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
    if (id === MODAL_INPUT_IDS.SEARCH_INPUT) setStep('selectDish');

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
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'selectDish'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="selectDish" />
            <SearchFood
              onFinish={handleDishSelect}
              mode="dishes-only"
              currentDishId={selectedDishId}
            />
          </div>
        }
      />

      {/* Step 2: Edit Products */}
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'products'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="products" />
            <div className={s.content}>
              <h2>Корректный список?</h2>
              <EditableList
                ref={editableListRef}
                items={adaptedItems}
                renderItem={(item) => item.contentProduct.name}
              />
              <div className={s.finishButton}>
                <button className={s.nextButton} onClick={handleConfirm}>
                  Выбрать
                </button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CopyToExistingDishModal;

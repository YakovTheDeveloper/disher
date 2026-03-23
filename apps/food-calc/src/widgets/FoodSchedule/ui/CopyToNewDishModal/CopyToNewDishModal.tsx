import { useCallback, useRef, useState } from 'react';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { EditableList, EditableListRef } from '@/features/manage-list/EditableList';
import { LabeledCheckbox } from '@/shared/ui/LabeledCheckbox';
import TextBehind from '@/shared/ui/TextBehind/TextBehind';
import { TextInput } from '@/shared/ui/atoms/input/TextInput';
import { Button } from '@/shared/ui/atoms/Button';
import toaster from '@/shared/lib/toaster/toaster';
import { RouterUrls } from '@/app/router';
import { isEmpty } from 'lodash';
import { createDishWithItems } from '@/entities/dish';
import { addScheduleFood, removeScheduleFoods } from '@/entities/schedule-food';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { MODAL_INPUT_IDS } from '../ScheduleFoodCreateModals';
import s from '../FoodScheduleModals.module.scss';
import { ScheduleFoodWithRelations } from '@/entities/schedule-food';

type Step = 'idle' | 'name' | 'products';

const STEPS: Step[] = ['name', 'products'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  name: 'Название',
  products: 'Продукты',
};

type Props = {
  isExpanded: boolean;
  items: ScheduleFoodWithRelations[];
  onFinish: () => void;
  onClose: () => void;
};

const CopyToNewDishModal = ({ isExpanded, items, onFinish, onClose }: Props) => {
  const [step, setStep] = useState<Step>('name');
  const editableListRef = useRef<EditableListRef>(null);
  const swapCheckboxRef = useRef<HTMLInputElement>(null);

  useSwipeableLock(isExpanded);

  const handleClose = () => {
    setStep('name');
    onClose();
  };

  const goToStep = (target: Step) => {
    setStep(target);
  };

  const handleNameNext = () => {
    const nameInput = document.getElementById(MODAL_INPUT_IDS.DISH_NAME_INPUT) as HTMLInputElement;
    const name = nameInput?.value?.trim();
    if (!name) {
      toaster.error('Введите название блюда');
      return;
    }
    setStep('products');
  };

  const handleConfirm = async () => {
    const shouldSwapProductsToDishInSchedule = swapCheckboxRef.current?.checked;
    const nameInput = document.getElementById(MODAL_INPUT_IDS.DISH_NAME_INPUT) as HTMLInputElement;
    const name = nameInput?.value?.trim();

    if (!name) {
      toaster.error('Введите название блюда');
      setStep('name');
      return;
    }

    const resultIds = editableListRef.current?.getResultedItemsIds();
    const selectedIds = resultIds?.asArray ?? [];

    if (!selectedIds || isEmpty(selectedIds)) {
      toaster.error('Выберите хотя бы 1 продукт');
      return;
    }

    const selectedItems = items.filter((item) => selectedIds.includes(item.id));
    const dishItems = selectedItems.map((item) => ({
      foodId: item.foodId!,
      quantity: item.quantity,
    }));

    const dishId = await createDishWithItems(name, dishItems);

    if (selectedItems.length <= 0) {
      toaster.error('Нет пересечений');
      return;
    }

    const first = selectedItems[0];
    const totalQuantity = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
    await addScheduleFood({
      date: first.date,
      time: first.time,
      type: 'dish',
      dishId,
      quantity: totalQuantity,
    });

    if (shouldSwapProductsToDishInSchedule) {
      await removeScheduleFoods(selectedIds);
    }

    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
    onFinish();
    setStep('name');
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === MODAL_INPUT_IDS.DISH_NAME_INPUT) setStep('name');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Dish Name */}
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'name'}
        content={
          <div className={s.wrapper}>
            <ModalStepHeader currentStep="name" steps={STEPS} stepLabels={STEP_LABELS} onBack={handleClose} onStepClick={goToStep} />
            <div className={s.spacer} />
            <div className={s.content}>
              <h2>Как назовёте блюдо?</h2>
              <TextBehind text="Блюдо">
                <TextInput id={MODAL_INPUT_IDS.DISH_NAME_INPUT} maxLength={255} />
              </TextBehind>
              <div className={s.finishButton}>
                <Button variant="primary-form" onClick={handleNameNext}>
                  Далее
                </Button>
              </div>
            </div>
          </div>
        }
      />

      {/* Step 2: Edit Products */}
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
                renderItem={(item) => (item as any).food?.name ?? '—'}
              />
              <LabeledCheckbox
                ref={swapCheckboxRef}
                label="Заменить выбранные продукты на новое блюдо"
                onChange={() => {}}
              />
              <div className={s.finishButton}>
                <Button variant="primary-form" onClick={handleConfirm}>
                  Создать блюдо
                </Button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CopyToNewDishModal;

import { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { EditableList, EditableListRef } from '@/components/features/manage-list/EditableList';
import { LabeledCheckbox } from '@/components/ui/LabeledCheckbox';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import toaster from '@/infrastructure/toaster/toaster';
import { isEmpty } from 'lodash';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import s from './FoodScheduleModals.module.scss';

type FoodContentProductInstance = any; // product content with name, foodId, quantity

type Step = 'idle' | 'name' | 'products';

const STEPS: Step[] = ['name', 'products'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  name: 'Название',
  products: 'Продукты',
};

type Props = {
  isExpanded: boolean;
  items: {
    id: string;
    contentProduct: FoodContentProductInstance;
  }[];
  onFinish: () => void;
  onClose: () => void;
};

const CreateDishAndCopyModal = ({ isExpanded, items, onFinish, onClose }: Props) => {
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
    const nameInput = document.getElementById('dish-name-input') as HTMLInputElement;
    const name = nameInput?.value?.trim();
    if (!name) {
      toaster.error('Введите название блюда');
      return;
    }
    setStep('products');
  };

  const handleConfirm = () => {
    const nameInput = document.getElementById('dish-name-input') as HTMLInputElement;
    const name = nameInput?.value?.trim();

    if (!name) {
      toaster.error('Введите название блюда');
      setStep('name');
      return;
    }

    const selectedIds = editableListRef.current?.getResultedItemsIds();

    if (!selectedIds || isEmpty(selectedIds)) {
      toaster.error('Выберите хотя бы 1 продукт');
      return;
    }

    const finalContent = items
      .filter(({ id }) => selectedIds.asSet.has(id))
      .map(({ contentProduct }) => contentProduct);

    // TODO: implement Triplit mutation -- create dish with products
    const dishId = '';

    toaster.success(`Блюдо "${name}" создано`);
    onFinish();
    setStep('name');
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === 'dish-name-input') setStep('name');

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
      {/* Step 1: Dish Name */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={isExpanded && step === 'name'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="name" />
            <div className={s.spacer} />
            <div className={s.content}>
              <h2>Как назовёте блюдо?</h2>
              <TextBehind text="Блюдо">
                <TextInput id="dish-name-input" maxLength={255} />
              </TextBehind>
              <div className={s.finishButton}>
                <button className={s.nextButton} onClick={handleNameNext}>
                  Далее
                </button>
              </div>
            </div>
          </div>
        }
      />

      {/* Step 2: Edit Products */}
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
                renderItem={(item) => item.contentProduct.name}
              />
              <LabeledCheckbox
                ref={swapCheckboxRef}
                label="Заменить выбранные продукты на новое блюдо"
              />
              <div className={s.finishButton}>
                <button className={s.nextButton} onClick={handleConfirm}>
                  Создать блюдо
                </button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CreateDishAndCopyModal;

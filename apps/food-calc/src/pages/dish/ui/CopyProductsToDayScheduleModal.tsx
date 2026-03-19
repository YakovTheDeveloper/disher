import { useRef, useState } from 'react';
import clsx from 'clsx';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { EditableList, EditableListRef } from '@/features/manage-list/EditableList';
import { ScheduleSelection } from '@/features/ScheduleSelection/ScheduleSelection';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { dishItemsToScheduleFoods } from '@/entities/dish';
import toaster from '@/shared/lib/toaster/toaster';
import { RouterLinks } from '@/router';
import s from '@/widgets/FoodSchedule/ui/FoodScheduleModals.module.scss';

type Step = 'idle' | 'date' | 'confirm';

const STEPS: Step[] = ['date', 'confirm'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  date: 'Дата',
  confirm: 'Подтверждение',
};

type DishItemForCopy = {
  id: string;
  foodName: string;
};

type Props = {
  isExpanded: boolean;
  dishId: string;
  items: DishItemForCopy[];
  onFinish: () => void;
  onClose: () => void;
};

const CopyProductsToDayScheduleModal = ({ isExpanded, dishId, items, onFinish, onClose }: Props) => {
  const [step, setStep] = useState<Step>('date');
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const editableListRef = useRef<EditableListRef>(null);

  useSwipeableLock(isExpanded);

  const handleClose = () => {
    setStep('date');
    setTargetDate(null);
    onClose();
  };

  const goToStep = (target: Step) => {
    setStep(target);
  };

  const handleDateSelect = (date: string) => {
    setTargetDate(date);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!targetDate) return;

    const selectedIds = editableListRef.current?.getResultedItemsIds();
    if (!selectedIds || selectedIds.asArray.length === 0) {
      toaster.error('Выберите хотя бы 1 элемент');
      return;
    }

    await dishItemsToScheduleFoods(dishId, targetDate, time, selectedIds.asArray);

    toaster.success(`Скопировано на ${targetDate}`, {
      action: { label: 'Открыть', href: `${RouterLinks.ScheduleBuilder}/${targetDate}` },
    });

    handleClose();
    onFinish();
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
    <div>
      {/* Step 1: Select Date */}
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'date'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="date" />
            <ScheduleSelection onSelect={handleDateSelect} selectedDate={targetDate ?? undefined} />
          </div>
        }
      />

      {/* Step 2: Time + Confirm Items */}
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'confirm'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="confirm" />
            <div className={s.content}>
              <TimeChoose
                onFinish={setTime}
                initialTime={time}
              />
              <EditableList
                ref={editableListRef}
                items={items}
                renderItem={(item) => item.foodName}
              />
              <div className={s.finishButton}>
                <button className={s.nextButton} onClick={handleConfirm}>
                  Скопировать на {targetDate}
                </button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CopyProductsToDayScheduleModal;

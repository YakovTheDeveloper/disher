import { useRef, useState } from 'react';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { EditableList, EditableListRef } from '@/features/manage-list/EditableList';
import { Button } from '@/shared/ui/atoms/Button';
import { ScheduleSelection } from '@/features/ScheduleSelection/ScheduleSelection';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { dishItemsToScheduleFoods } from '@/entities/dish';
import toaster from '@/shared/lib/toaster/toaster';
import { RouterLinks } from '@/app/router';
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

  return (
    <div>
      {/* Step 1: Select Date */}
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'date'}
        content={
          <div className={s.wrapper}>
            <ModalStepHeader currentStep="date" steps={STEPS} stepLabels={STEP_LABELS} onBack={handleClose} onStepClick={goToStep} />
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
            <ModalStepHeader currentStep="confirm" steps={STEPS} stepLabels={STEP_LABELS} onBack={handleClose} onStepClick={goToStep} />
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
                <Button variant="primary-form" onClick={handleConfirm}>
                  Скопировать на {targetDate}
                </Button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CopyProductsToDayScheduleModal;

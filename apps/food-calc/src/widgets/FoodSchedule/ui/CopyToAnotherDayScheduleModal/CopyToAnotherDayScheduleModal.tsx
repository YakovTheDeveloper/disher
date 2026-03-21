import { useRef, useState } from 'react';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { EditableList, EditableListRef } from '@/features/manage-list/EditableList';
import { Button } from '@/shared/ui/atoms/Button';
import { ScheduleSelection } from '@/features/ScheduleSelection/ScheduleSelection';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { copyScheduleFoods } from '@/entities/schedule-food';
import toaster from '@/shared/lib/toaster/toaster';
import type { ScheduleFood } from '@/entities/schedule-food';
import { RouterLinks } from '@/app/router';
import s from '../FoodScheduleModals.module.scss';

type Step = 'idle' | 'date' | 'confirm';

const STEPS: Step[] = ['date', 'confirm'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  date: 'Дата',
  confirm: 'Подтверждение',
};

type Props = {
  isExpanded: boolean;
  sourceDate: string;
  items: ScheduleFood[];
  onFinish: () => void;
  onClose: () => void;
};

const getItemName = (item: ScheduleFood): string => {
  return (item as any).food?.name ?? (item as any).dish?.name ?? '—';
};

const CopyToAnotherDayScheduleModal = ({ isExpanded, sourceDate, items, onFinish, onClose }: Props) => {
  const [step, setStep] = useState<Step>('date');
  const [targetDate, setTargetDate] = useState<string | null>(null);
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

    await copyScheduleFoods(sourceDate, targetDate, selectedIds.asArray);

    toaster.success(`Скопировано на ${targetDate}`, {
      action: { label: 'Открыть', href: `${RouterLinks.ScheduleBuilder}/${targetDate}` },
    });

    handleClose();
    onFinish();
  };

  const Header = ({ currentStep }: { currentStep: Exclude<Step, 'idle'> }) => (
    <header className={s.header}>
      <button className={s.backButton} onClick={handleClose}>
        ←
      </button>
      <Breadcrumbs steps={STEPS} current={currentStep} stepLabels={STEP_LABELS} onStepClick={goToStep} />
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

      {/* Step 2: Confirm Items + Mode */}
      <ModalByLabel
        position="absolute"
        isExpanded={isExpanded && step === 'confirm'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="confirm" />
            <div className={s.content}>
              <EditableList
                ref={editableListRef}
                items={items}
                renderItem={(item) => getItemName(item)}
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

export default CopyToAnotherDayScheduleModal;

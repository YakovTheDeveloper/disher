import { useRef, useState } from 'react';
import clsx from 'clsx';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { EditableList, EditableListRef } from '@/components/features/manage-list/EditableList';
import { ScheduleSelection } from '@/components/features/ScheduleSelection/ScheduleSelection';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import { copyScheduleFoods, removeScheduleFoods } from '@/entities/schedule-food';
import toaster from '@/infrastructure/toaster/toaster';
import type { ScheduleFood } from '@/entities/schedule-food';
import s from './FoodScheduleModals.module.scss';

type Step = 'idle' | 'date' | 'confirm';

const STEPS: Step[] = ['date', 'confirm'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  date: 'Дата',
  confirm: 'Подтверждение',
};

type Mode = 'copy' | 'move';

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
  const [mode, setMode] = useState<Mode>('copy');
  const editableListRef = useRef<EditableListRef>(null);

  useSwipeableLock(isExpanded);

  const handleClose = () => {
    setStep('date');
    setTargetDate(null);
    setMode('copy');
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

    if (mode === 'move') {
      await removeScheduleFoods(selectedIds.asArray);
    }

    toaster.success(
      mode === 'copy'
        ? `Скопировано на ${targetDate}`
        : `Перемещено на ${targetDate}`
    );

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
      <SearchFormExpandable
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
      <SearchFormExpandable
        position="absolute"
        isExpanded={isExpanded && step === 'confirm'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="confirm" />
            <div className={s.content}>
              <div className={s.modeToggle}>
                <button
                  className={clsx(s.modeButton, mode === 'copy' && s.modeActive)}
                  onClick={() => setMode('copy')}
                >
                  Копировать
                </button>
                <button
                  className={clsx(s.modeButton, mode === 'move' && s.modeActive)}
                  onClick={() => setMode('move')}
                >
                  Переместить
                </button>
              </div>
              <EditableList
                ref={editableListRef}
                items={items}
                renderItem={(item) => getItemName(item)}
              />
              <div className={s.finishButton}>
                <button className={s.nextButton} onClick={handleConfirm}>
                  {mode === 'copy' ? 'Скопировать' : 'Переместить'} на {targetDate}
                </button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CopyToAnotherDayScheduleModal;

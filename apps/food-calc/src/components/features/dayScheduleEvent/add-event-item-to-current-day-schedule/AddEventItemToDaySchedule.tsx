import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import { Instance } from 'mobx-state-tree';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { TimeChoose } from '@/components/ui/TimeChoose';
import { domainStore } from '@/store/store';
import Button from '@/components/ui/atoms/Button/Button';
import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { AtomBuilder } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/AtomBuilder';
import { ScheduleEvent } from '@/domain/schedule/scheduleEvent/ScheduleEvent.model';
import s from './AddEventItemToDaySchedule.module.scss';

export type Step = 'idle' | 'time' | 'text' | 'atoms';

const STEPS: Step[] = ['time', 'text', 'atoms'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  time: 'Время',
  text: 'Текст',
  atoms: 'Теги',
};

const NEXT_INPUT_ID: Record<string, string> = {
  time: 'event-text',
};

const NEXT_STEP: Partial<Record<Step, Exclude<Step, 'idle'>>> = {
  text: 'atoms',
};

type Props = {
  scheduleId: string;
  /** If provided, edit an existing event instead of the draft */
  event?: Instance<typeof ScheduleEvent>;
  /** Open directly at a specific step */
  initialStep?: Exclude<Step, 'idle'>;
  /** Called when the modal should close (edit mode) */
  onClose?: () => void;
};

const AddEventItemToDaySchedule = observer(({ scheduleId, event, initialStep, onClose }: Props) => {
  const isEditMode = !!event;
  const [step, setStep] = useState<Step>(initialStep ?? 'idle');
  useSwipeableLock(step !== 'idle');
  const { eventScheduleStore } = domainStore;
  const target = event ?? eventScheduleStore.eventDraft;

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === 'time-input') setStep('time');
    else if (id === 'event-text') setStep('text');
    else if (id === 'event-atoms') setStep('atoms');
    else return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => {
    target.updateTime(time);
  };

  const handleTextChange = (value: string) => {
    target.setText(value);
  };

  const handleCommit = () => {
    if (isEditMode) {
      onClose?.();
      return;
    }
    eventScheduleStore.commitEventDraft(scheduleId);
    setStep('idle');
  };

  const handleClose = () => {
    if (isEditMode) {
      onClose?.();
      return;
    }
    eventScheduleStore.clearEventDraft();
    setStep('idle');
  };

  const handleApply = () => {
    onClose?.();
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

  const NextStepButton = ({ currentStep }: { currentStep: Step }) => {
    if (isEditMode) {
      return (
        <div className={s.finishButton}>
          <Button variant="primary" onClick={handleApply}>
            Применить
          </Button>
        </div>
      );
    }

    const nextStep = NEXT_STEP[currentStep];
    if (nextStep) {
      return (
        <div className={s.finishButton}>
          <Button variant="primary" onClick={() => goToStep(nextStep)}>
            Далее
          </Button>
        </div>
      );
    }

    const nextInputId = NEXT_INPUT_ID[currentStep];
    if (!nextInputId) return null;

    return (
      <div className={s.finishButton}>
        <label htmlFor={nextInputId} className={s.nextLabel}>
          <span className={s.nextButton}>Далее</span>
        </label>
      </div>
    );
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Time */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="time" />
            <div className={s.spacer} />
            <div className={s.content}>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={target.time}
                inputId="time-input"
              />
              <NextStepButton currentStep="time" />
            </div>
          </div>
        }
      />

      {/* Step 2: Text */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="text" />
            <div className={s.spacer} />
            <div className={s.content}>
              <Textarea id="event-text" onChange={handleTextChange} value={target.text} />
              <NextStepButton currentStep="text" />
            </div>
          </div>
        }
      />

      {/* Step 3: Atoms/Tags */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'atoms'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="atoms" />
            <div className={s.spacer} />
            <div className={s.content}>
              <div id="event-atoms" tabIndex={-1}>
                <AtomBuilder event={target} onEventChange={() => {}} />
              </div>
              <div className={s.finishButton}>
                <Button variant="primary" onClick={handleCommit}>
                  {isEditMode ? 'Применить' : 'Готово'}
                </Button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
});

export default AddEventItemToDaySchedule;

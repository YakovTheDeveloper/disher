import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { addScheduleEvent } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import Button from '@/shared/ui/atoms/Button/Button';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { AtomBuilder } from '@/widgets/ScheduleEvents/components/AtomBuilder';
import s from './ScheduleEventModals.module.scss';

/**
 * Input IDs used for label→input focus delegation across ScheduleEvent modals.
 *
 * Each modal step is opened by a <label htmlFor={ID}> that focuses the corresponding <input id={ID}>.
 * The onFocusCapture handler reads e.target.id to determine which step is active.
 *
 * ScheduleEventCreationModals (this file):
 *   - TIME_INPUT → TimeChoose input (step: time)
 *   - TEXT_INPUT → Textarea for event text (step: text)
 *   - ATOMS_INPUT → AtomBuilder container (step: atoms)
 */
export const MODAL_INPUT_IDS = {
  TIME_INPUT: 'time-input-schedule-event',
  TEXT_INPUT: 'event-text',
  ATOMS_INPUT: 'event-atoms',
} as const;

type Step = 'idle' | 'time' | 'text' | 'atoms';

const STEPS: Step[] = ['time', 'text', 'atoms'];

const STEP_LABELS: Record<Exclude<Step, 'idle'>, string> = {
  time: 'Время',
  text: 'Текст',
  atoms: 'Теги',
};

const NEXT_INPUT_ID: Record<string, string> = {
  time: MODAL_INPUT_IDS.TEXT_INPUT,
};

const NEXT_STEP: Partial<Record<Step, Exclude<Step, 'idle'>>> = {
  text: 'atoms',
};

type DraftState = {
  time: string;
  text: string;
};

const createEmptyDraft = (): DraftState => ({
  time: new Date().toTimeString().slice(0, 5),
  text: '',
});

type Props = {
  scheduleId: string;
};

const ScheduleEventCreationModals = ({ scheduleId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft);
  const draftAtoms = useEventDraftStore((s) => s.draft.atoms);
  const clearAtoms = useEventDraftStore((s) => s.clearAtoms);
  useSwipeableLock(step !== 'idle');

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === MODAL_INPUT_IDS.TIME_INPUT) setStep('time');
    else if (id === MODAL_INPUT_IDS.TEXT_INPUT) setStep('text');
    else if (id === MODAL_INPUT_IDS.ATOMS_INPUT) setStep('atoms');
    else return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  };

  const handleTextChange = (value: string) => {
    setDraft((prev) => ({ ...prev, text: value }));
  };

  const handleCommit = async () => {
    await addScheduleEvent({
      date: scheduleId,
      time: draft.time,
      text: draft.text,
      atoms: draftAtoms,
    });
    setDraft(createEmptyDraft());
    clearAtoms();
    setStep('idle');
  };

  const handleClose = () => {
    setDraft(createEmptyDraft());
    clearAtoms();
    setStep('idle');
  };

  const goToStep = (target: Step) => {
    setStep(target);
  };

  const Header = ({ currentStep }: { currentStep: Exclude<Step, 'idle'> }) => (
    <header className={s.header}>
      <button className={s.backButton} onClick={handleClose}>
        ←
      </button>
      <Breadcrumbs steps={STEPS} current={currentStep} stepLabels={STEP_LABELS} onStepClick={goToStep} />
    </header>
  );

  const NextStepLabel = ({
    currentStep,
    children,
  }: {
    currentStep: Step;
    children: React.ReactNode;
  }) => {
    const nextInputId = NEXT_INPUT_ID[currentStep];
    if (!nextInputId) return null;

    return (
      <label htmlFor={nextInputId} className={s.nextLabel}>
        {children}
      </label>
    );
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Time — trigger: <label htmlFor={MODAL_INPUT_IDS.TIME_INPUT}> */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="time" />
            <div className={s.spacer} />
            <div className={s.content}>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={MODAL_INPUT_IDS.TIME_INPUT}
              />
              <div className={s.finishButton}>
                <NextStepLabel currentStep="time">
                  <span className={s.nextButton}>Далее</span>
                </NextStepLabel>
              </div>
            </div>
          </div>
        }
      />

      {/* Step 2: Text — trigger: NextStepLabel(time) → htmlFor={MODAL_INPUT_IDS.TEXT_INPUT} */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="text" />
            <div className={s.spacer} />
            <div className={s.content}>
              <Textarea id={MODAL_INPUT_IDS.TEXT_INPUT} onChange={handleTextChange} value={draft.text} />
              <div className={s.finishButton}>
                {NEXT_STEP[step] ? (
                  <Button variant="primary" onClick={() => goToStep(NEXT_STEP[step]!)}>
                    Далее
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        }
      />

      {/* Step 3: Atoms/Tags — trigger: button from step 2 */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'atoms'}
        content={
          <div className={s.wrapper}>
            <Header currentStep="atoms" />
            <div className={s.spacer} />
            <div className={s.content}>
              <div id={MODAL_INPUT_IDS.ATOMS_INPUT} tabIndex={-1}>
                <AtomBuilder />
              </div>
              <div className={s.finishButton}>
                <Button variant="primary" onClick={handleCommit}>
                  Готово
                </Button>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default ScheduleEventCreationModals;

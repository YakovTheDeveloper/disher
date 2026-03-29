import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter, NextArrow, NextStepButton } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { addScheduleEvent } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import Button from '@/shared/ui/atoms/Button/Button';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { AtomBuilder } from '@/widgets/ScheduleEvents/components/AtomBuilder';
import { Typography } from '@/shared/ui/atoms/Typography';

/**
 * Input IDs used for label→input focus delegation across ScheduleEvent modals.
 *
 * Each modal step is opened by a <label htmlFor={ID}> that focuses the corresponding <input id={ID}>.
 * The onFocusCapture handler reads e.target.id to determine which step is active.
 *
 * ScheduleEventCreateModals (this file):
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
type ActiveStep = Exclude<Step, 'idle'>;

const STEPS: ActiveStep[] = ['time', 'text', 'atoms'];

const STEP_LABELS: Record<ActiveStep, string> = {
  time: 'Время',
  text: 'Текст',
  atoms: 'Теги',
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

const ScheduleEventCreateModals = ({ scheduleId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft);
  const draftAtoms = useEventDraftStore((s) => s.draft.atoms);
  const clearAtoms = useEventDraftStore((s) => s.clearAtoms);
  useSwipeableLock(step !== 'idle');

  const INPUT_TO_STEP: Record<string, ActiveStep> = {
    [MODAL_INPUT_IDS.TIME_INPUT]: 'time',
    [MODAL_INPUT_IDS.TEXT_INPUT]: 'text',
    [MODAL_INPUT_IDS.ATOMS_INPUT]: 'atoms',
  };

  const handleFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      const nextStep = INPUT_TO_STEP[target.id];
      if (!nextStep) return;

      setStep((prev) => {
        if (prev === 'idle') {
          setDraft(createEmptyDraft());
          clearAtoms();
        }
        return nextStep;
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        });
      });
    },
    [clearAtoms]
  );

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

  useOverlayHistory(step !== 'idle', handleClose);

  const goToStep = (target: Step) => {
    setStep(target);
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Time — trigger: <label htmlFor={MODAL_INPUT_IDS.TIME_INPUT}> */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="time"
              steps={STEPS}
              stepLabels={STEP_LABELS}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.Spacer />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={MODAL_INPUT_IDS.TIME_INPUT}
                after={<NextArrow htmlFor={MODAL_INPUT_IDS.TEXT_INPUT} />}
              />
              <ModalFooter onBack={handleClose}>
                <NextStepButton htmlFor={MODAL_INPUT_IDS.TEXT_INPUT} />
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 2: Text — trigger: NextStepButton(time) → htmlFor={MODAL_INPUT_IDS.TEXT_INPUT} */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="text"
              steps={STEPS}
              stepLabels={STEP_LABELS}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.Spacer />
            <ModalShell.Body>
              <Typography variant="elegant">Опишите, что чувствуете или что произошло</Typography>
              <Textarea
                placeholder="Опишите событие"
                id={MODAL_INPUT_IDS.TEXT_INPUT}
                onChange={handleTextChange}
                value={draft.text}
                rows={5}
              />
              <ModalFooter onBack={() => goToStep('time')}>
                <Button variant="primary-form" onClick={() => goToStep('atoms')}>
                  Далее
                </Button>
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 3: Atoms/Tags — trigger: button from step 2 */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'atoms'}
        content={
          <ModalShell>
            <ModalStepHeader
              currentStep="atoms"
              steps={STEPS}
              stepLabels={STEP_LABELS}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.AtomsBody>
              {step === 'atoms' && <AtomBuilder id={MODAL_INPUT_IDS.ATOMS_INPUT} />}
              <ModalFooter onBack={() => goToStep('text')}>
                <Button variant="primary-form" onClick={handleCommit}>
                  Готово
                </Button>
              </ModalFooter>
            </ModalShell.AtomsBody>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleEventCreateModals;

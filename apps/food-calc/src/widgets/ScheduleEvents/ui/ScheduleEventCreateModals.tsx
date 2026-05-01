import { useCallback, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalStepHeader } from '@/shared/ui/ModalStepHeader';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter, ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { TimeChoose, type TimeRangeState } from '@/shared/ui/TimeChoose';
import { addScheduleEvent } from '@/entities/schedule-event';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import Button from '@/shared/ui/atoms/Button/Button';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { AtomBuilder } from '@/widgets/ScheduleEvents/components/AtomBuilder';
import modalStyles from './ScheduleEventModals.module.scss';
import { MODAL_INPUT_IDS } from './ScheduleEventCreateModals.constants';
import { ButtonBack } from '@/shared/ui/atoms/Button/ButtonBack';

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
  endTime: string | null;
  text: string;
};

const createEmptyDraft = (): DraftState => ({
  time: new Date().toTimeString().slice(0, 5),
  endTime: null,
  text: '',
});

type Props = {
  scheduleId: string;
};

const ScheduleEventCreateModals = ({ scheduleId }: Props) => {
  const [step, setStep] = useState<Step>('idle');
  const [atomPanelOpen, setAtomPanelOpen] = useState(false);
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

  const handleRangeChange = (range: TimeRangeState) => {
    setDraft((prev) => ({
      ...prev,
      time: range.from,
      endTime: range.toExplicitlySet ? range.to : null,
    }));
  };

  const handleTextChange = (value: string) => {
    setDraft((prev) => ({ ...prev, text: value }));
  };

  const handleCommit = async () => {
    const result = await safeMutate(
      () =>
        addScheduleEvent({
          date: scheduleId,
          time: draft.time,
          endTime: draft.endTime ?? undefined,
          text: draft.text,
          atoms: draftAtoms,
        }),
      'Не удалось создать событие'
    );
    if (result === undefined) return;
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

  const timeResult = draft.endTime ? `${draft.time}–${draft.endTime}` : draft.time;
  const textResult = draft.text ? draft.text : undefined;
  const stepResults = { time: timeResult, text: textResult };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Time — trigger: <label htmlFor={MODAL_INPUT_IDS.TIME_INPUT}> */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell className={modalStyles.whiteShell}>
            <ModalShell.Body>
              <ModalShell.Title>Выберите время</ModalShell.Title>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={MODAL_INPUT_IDS.TIME_INPUT}
                range={{
                  initialFrom: draft.time,
                  initialTo: draft.endTime ?? undefined,
                  onChangeRange: handleRangeChange,
                }}
              />
              <ModalShell.ActionButtons
                left={<ModalPrevButton onClick={handleClose} />}
                right={<ModalNextButton as="label" htmlFor={MODAL_INPUT_IDS.TEXT_INPUT} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 2: Text — trigger: NextStepButton(time) → htmlFor={MODAL_INPUT_IDS.TEXT_INPUT} */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <ModalShell className={modalStyles.whiteShell}>
            <ModalStepHeader
              currentStep="text"
              steps={STEPS}
              stepLabels={STEP_LABELS}
              stepResults={stepResults}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.Body>
              <ModalShell.Title>Опишите событие</ModalShell.Title>

              <Textarea
                placeholder="Опишите событие"
                id={MODAL_INPUT_IDS.TEXT_INPUT}
                onChange={handleTextChange}
                value={draft.text}
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={() => goToStep('atoms')} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 3: Atoms/Tags — trigger: button from step 2 */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'atoms'}
        content={
          <ModalShell className={modalStyles.whiteShell}>
            {!atomPanelOpen && (
              <ModalStepHeader
                currentStep="atoms"
                steps={STEPS}
                stepLabels={STEP_LABELS}
                stepResults={stepResults}
                onBack={handleClose}
                onStepClick={goToStep}
              />
            )}
            <ModalShell.AtomsBody>
              <ModalShell.Title>
                <ButtonBack onClick={() => goToStep('text')} />
                Добавьте теги
              </ModalShell.Title>
              {step === 'atoms' && (
                <AtomBuilder id={MODAL_INPUT_IDS.ATOMS_INPUT} onPanelChange={setAtomPanelOpen} />
              )}
              {!atomPanelOpen && (
                <ModalFooter onBack={() => goToStep('text')}>
                  <ModalNextButton onClick={handleCommit} />
                </ModalFooter>
              )}
            </ModalShell.AtomsBody>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleEventCreateModals;

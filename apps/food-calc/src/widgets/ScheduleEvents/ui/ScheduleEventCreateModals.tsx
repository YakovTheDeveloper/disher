import { useCallback, useEffect, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { TimeChoose, type TimeRangeState } from '@/shared/ui/TimeChoose';
import { addScheduleEvent } from '@/entities/schedule-event';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { AtomBuilder } from '@/widgets/ScheduleEvents/components/AtomBuilder';
import modalStyles from './ScheduleEventModals.module.scss';
import { MODAL_INPUT_IDS } from './ScheduleEventCreateModals.constants';

type Step = 'idle' | 'time' | 'text' | 'atoms';
type ActiveStep = Exclude<Step, 'idle'>;

// Порядок шагов: сначала описание (что произошло), потом время, потом
// особенности. Поменяно с прежнего ['time', 'text', 'atoms'] — описание
// читается как «о чём событие?», а время уточняет «когда».
const STEPS: ActiveStep[] = ['text', 'time', 'atoms'];

const STEP_LABELS: Record<ActiveStep, string> = {
  time: 'Время',
  text: 'Описание',
  atoms: 'Особенности',
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
  // Посещённые шаги текущей сессии — для `results`-вида Breadcrumbs.
  // Обнуляется при возврате в 'idle' (любое закрытие/коммит).
  const [visitedSteps, setVisitedSteps] = useState<ActiveStep[]>([]);
  const draftAtoms = useEventDraftStore((s) => s.draft.atoms);
  const clearAtoms = useEventDraftStore((s) => s.clearAtoms);
  useSwipeableLock(step !== 'idle');

  useEffect(() => {
    if (step === 'idle') {
      setVisitedSteps((prev) => (prev.length ? [] : prev));
      return;
    }
    setVisitedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, [step]);

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

      // scrollIntoView только для мелких инпутов (время/текст). Цель шага
      // 'atoms' — корневой <div> AtomBuilder, а он flex:1 во весь экран:
      // block:'center' попытается «отцентрировать» стоэкранный элемент и
      // протащит модалку / visual viewport на iOS.
      if (nextStep !== 'atoms') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
          });
        });
      }
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
    if (!result.ok) return;
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

  // Стрелка «назад» в модалках со Steps bar закрывает весь флоу: вернуться на
  // пройденный шаг можно кликом по табу в Steps.

  const timeResult = draft.endTime ? `${draft.time}–${draft.endTime}` : draft.time;
  const textResult = draft.text ? draft.text : undefined;
  const stepResults = { time: timeResult, text: textResult };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Step 1: Text (Описание) — trigger: <label htmlFor={MODAL_INPUT_IDS.TEXT_INPUT}> */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <ModalShell variant="spring4" className={modalStyles.whiteShell}>
            <ModalShell.StepHeader
              title={STEP_LABELS.text}
              currentStep="text"
              steps={STEPS}
              stepLabels={STEP_LABELS}
              stepResults={stepResults}
              visitedSteps={visitedSteps}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.Body>
              <AutoGrowSearch
                placeholder="Опишите событие"
                id={MODAL_INPUT_IDS.TEXT_INPUT}
                onChange={handleTextChange}
                value={draft.text}
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton as="label" htmlFor={MODAL_INPUT_IDS.TIME_INPUT} />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Step 2: Time (Время) — trigger: ModalNextButton(text) → htmlFor={MODAL_INPUT_IDS.TIME_INPUT} */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell variant="spring4" className={modalStyles.whiteShell}>
            <ModalShell.StepHeader
              title={STEP_LABELS.time}
              currentStep="time"
              steps={STEPS}
              stepLabels={STEP_LABELS}
              stepResults={stepResults}
              visitedSteps={visitedSteps}
              onBack={handleClose}
              onStepClick={goToStep}
            />
            <ModalShell.Body>
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
          <ModalShell variant="spring4" className={modalStyles.whiteShell}>
            {!atomPanelOpen && (
              <ModalShell.StepHeader
                title={STEP_LABELS.atoms}
                currentStep="atoms"
                steps={STEPS}
                stepLabels={STEP_LABELS}
                stepResults={stepResults}
                onBack={handleClose}
                onStepClick={goToStep}
              />
            )}
            <ModalShell.AtomsBody>
              {step === 'atoms' && (
                <AtomBuilder id={MODAL_INPUT_IDS.ATOMS_INPUT} onPanelChange={setAtomPanelOpen} />
              )}
            </ModalShell.AtomsBody>
            {!atomPanelOpen && (
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={handleCommit} variant="finish" />}
              />
            )}
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleEventCreateModals;

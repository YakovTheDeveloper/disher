import { useCallback, useEffect, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { updateScheduleEvent } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import Button from '@/shared/ui/atoms/Button/Button';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { AtomBuilder } from '@/widgets/ScheduleEvents/components/AtomBuilder';
import type { ScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import { Typography } from '@/shared/ui/atoms/Typography';

export const EDIT_MODAL_INPUT_IDS = {
  TIME_INPUT: 'time-input-edit-schedule-event',
  TEXT_INPUT: 'event-text-edit',
  ATOMS_INPUT: 'event-atoms-edit',
} as const;

type Step = 'idle' | 'time' | 'text' | 'atoms';

type DraftState = {
  time: string;
  text: string;
};

type Props = {
  item: ScheduleEvent;
  initialStep?: Step;
  onClose: () => void;
};

const ScheduleEventEditModal = ({ item, initialStep = 'idle', onClose }: Props) => {
  const [step, setStep] = useState<Step>(initialStep);
  const [draft, setDraft] = useState<DraftState>(() => ({
    time: item.time,
    text: item.text,
  }));
  const draftAtoms = useEventDraftStore((s) => s.draft.atoms);
  const clearAtoms = useEventDraftStore((s) => s.clearAtoms);

  useEffect(() => {
    const store = useEventDraftStore.getState();
    store.clearAtoms();
    const existingAtoms = (item.atoms ?? []) as Atom[];
    for (const atom of existingAtoms) {
      store.addAtom(atom);
    }
  }, [item.id]);

  useSwipeableLock(step !== 'idle');
  useOverlayHistory(step !== 'idle', () => {
    setStep('idle');
    onClose();
  });

  const handleClose = () => {
    setStep('idle');
    onClose();
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const id = target.id;
    if (id === EDIT_MODAL_INPUT_IDS.TIME_INPUT) setStep('time');
    else if (id === EDIT_MODAL_INPUT_IDS.TEXT_INPUT) setStep('text');
    else if (id === EDIT_MODAL_INPUT_IDS.ATOMS_INPUT) setStep('atoms');
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
    await updateScheduleEvent(item.id, {
      time: draft.time,
      text: draft.text,
      atoms: draftAtoms,
    });
    clearAtoms();
    setStep('idle');
    onClose();
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {/* Time */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <ModalShell>
            <ModalShell.Spacer />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={EDIT_MODAL_INPUT_IDS.TIME_INPUT}
              />
              <ModalFooter onBack={handleClose}>
                <Button variant="primary-form" onClick={handleCommit}>
                  Готово
                </Button>
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Text */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <ModalShell>
            <ModalShell.Spacer />
            <ModalShell.Body>
              <Typography variant="elegant">Опишите, что чувствуете или что произошло</Typography>
              <Textarea
                id={EDIT_MODAL_INPUT_IDS.TEXT_INPUT}
                onChange={handleTextChange}
                value={draft.text}
              />
              <ModalFooter onBack={handleClose}>
                <Button variant="primary-form" onClick={handleCommit}>
                  Готово
                </Button>
              </ModalFooter>
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Atoms/Tags */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'atoms'}
        content={
          <ModalShell>
            <ModalShell.AtomsBody>
              <div id={EDIT_MODAL_INPUT_IDS.ATOMS_INPUT} tabIndex={-1}>
                <AtomBuilder />
              </div>
              <ModalFooter onBack={handleClose}>
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

export default ScheduleEventEditModal;

import { useCallback, useEffect, useState } from 'react';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { TimeChoose } from '@/components/ui/TimeChoose';
import { updateScheduleEvent } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import Button from '@/components/ui/atoms/Button/Button';
import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { AtomBuilder } from '@/components/widgets/ScheduleEvents/components/AtomBuilder';
import type { ScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import s from './ScheduleEventModals.module.scss';

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

const EditScheduleEventModal = ({ item, initialStep = 'idle', onClose }: Props) => {
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
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'time'}
        content={
          <div className={s.wrapper}>
            <div className={s.spacer} />
            <div className={s.content}>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={EDIT_MODAL_INPUT_IDS.TIME_INPUT}
              />
              <div className={s.finishButton}>
                <Button variant="primary" onClick={handleCommit}>
                  Готово
                </Button>
              </div>
            </div>
          </div>
        }
      />

      {/* Text */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <div className={s.wrapper}>
            <div className={s.spacer} />
            <div className={s.content}>
              <Textarea id={EDIT_MODAL_INPUT_IDS.TEXT_INPUT} onChange={handleTextChange} value={draft.text} />
              <div className={s.finishButton}>
                <Button variant="primary" onClick={handleCommit}>
                  Готово
                </Button>
              </div>
            </div>
          </div>
        }
      />

      {/* Atoms/Tags */}
      <SearchFormExpandable
        position="absolute"
        isExpanded={step === 'atoms'}
        content={
          <div className={s.wrapper}>
            <div className={s.spacer} />
            <div className={s.content}>
              <div id={EDIT_MODAL_INPUT_IDS.ATOMS_INPUT} tabIndex={-1}>
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

export default EditScheduleEventModal;

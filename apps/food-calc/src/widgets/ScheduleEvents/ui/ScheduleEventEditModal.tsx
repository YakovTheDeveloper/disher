import { useCallback, useEffect, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { TimeChoose, type TimeRangeState } from '@/shared/ui/TimeChoose';
import { updateScheduleEvent } from '@/entities/schedule-event';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { AtomBuilder } from '@/widgets/ScheduleEvents/components/AtomBuilder';
import type { ScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import modalStyles from './ScheduleEventModals.module.scss';
import { EDIT_MODAL_INPUT_IDS } from './ScheduleEventEditModal.constants';

type Step = 'idle' | 'time' | 'text' | 'atoms';

type DraftState = {
  time: string;
  endTime: string | null;
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
    endTime: item.endTime ?? null,
    text: item.text ?? '',
  }));
  const clearAtoms = useEventDraftStore((s) => s.clearAtoms);

  useEffect(() => {
    const store = useEventDraftStore.getState();
    store.clearAtoms(); // also resets pendingScale
    const existingAtoms = (typeof item.atoms === 'string' ? JSON.parse(item.atoms) : item.atoms ?? []) as Atom[];
    for (const atom of existingAtoms) {
      store.addAtom(atom);
    }
    // Seed the scale form from the event's existing scale (if any) so the Оценка
    // step shows/edits it instead of a blank 5.
    const scale = existingAtoms.find((a) => a.kind === 'scale');
    if (scale && scale.kind === 'scale') store.hydratePendingScale(scale);
  }, [item.id]);

  useSwipeableLock(step !== 'idle');
  useOverlayHistory(step !== 'idle', () => {
    setStep('idle');
    onClose();
  });

  const handleClose = () => {
    // Cancel = discard. Clear the shared draft so the loaded atoms don't leak
    // into the next event created on the same day (the draft is a singleton).
    clearAtoms();
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

    // Контейнер атомов — flex:1 во весь экран; scrollIntoView({block:'center'})
    // на нём тащит модалку / visual viewport на iOS. Скроллим только мелкие
    // инпуты (время/текст).
    if (id === EDIT_MODAL_INPUT_IDS.ATOMS_INPUT) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleTimeFinish = (time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  };

  const handleRangeChange = (range: TimeRangeState) => {
    setDraft((prev) => ({ ...prev, time: range.from, endTime: range.toExplicitlySet ? range.to : null }));
  };

  const handleTextChange = (value: string) => {
    setDraft((prev) => ({ ...prev, text: value }));
  };

  const handleCommit = async () => {
    // Flush the pending scale into atoms BEFORE reading them — «Готово» must not
    // drop a rating the user typed but didn't separately confirm.
    const store = useEventDraftStore.getState();
    store.commitPendingScale();
    const atoms = store.draft.atoms;
    const result = await safeMutate(
      () => updateScheduleEvent(item.id, { time: draft.time, endTime: draft.endTime ?? undefined, text: draft.text, atoms }),
      'Не удалось обновить событие',
    );
    if (!result.ok) return;
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
          <ModalShell variant="spring4" className={modalStyles.whiteShell}>
            <ModalShell.Header title="Выберите время" onBack={handleClose} />
            <ModalShell.Body>
              <TimeChoose
                onFinish={handleTimeFinish}
                initialTime={draft.time}
                inputId={EDIT_MODAL_INPUT_IDS.TIME_INPUT}
                range={{
                  initialFrom: draft.time,
                  initialTo: draft.endTime ?? undefined,
                  onChangeRange: handleRangeChange,
                }}
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={handleCommit} variant="finish" />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Text */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'text'}
        content={
          <ModalShell variant="spring4" className={modalStyles.whiteShell}>
            <ModalShell.Header title="Опишите событие" onBack={handleClose} />
            <ModalShell.Body>
              <AutoGrowSearch
                id={EDIT_MODAL_INPUT_IDS.TEXT_INPUT}
                onChange={handleTextChange}
                value={draft.text}
                placeholder="Опишите событие"
              />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={handleCommit} variant="finish" />}
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />

      {/* Atoms/Tags */}
      <ModalByLabel
        position="absolute"
        isExpanded={step === 'atoms'}
        content={
          <ModalShell variant="spring4" className={modalStyles.whiteShell}>
            <ModalShell.Header title="Оценка" onBack={handleClose} />
            <ModalShell.AtomsBody>
              <AtomBuilder id={EDIT_MODAL_INPUT_IDS.ATOMS_INPUT} />
              <ModalShell.ActionButtons
                right={<ModalNextButton onClick={handleCommit} variant="finish" />}
              />
            </ModalShell.AtomsBody>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleEventEditModal;

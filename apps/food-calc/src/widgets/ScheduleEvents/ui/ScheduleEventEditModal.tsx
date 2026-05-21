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
  const [atomPanelOpen, setAtomPanelOpen] = useState(false);
  const [draft, setDraft] = useState<DraftState>(() => ({
    time: item.time,
    endTime: item.endTime ?? null,
    text: item.text ?? '',
  }));
  const draftAtoms = useEventDraftStore((s) => s.draft.atoms);
  const clearAtoms = useEventDraftStore((s) => s.clearAtoms);

  useEffect(() => {
    const store = useEventDraftStore.getState();
    store.clearAtoms();
    const existingAtoms = (typeof item.atoms === 'string' ? JSON.parse(item.atoms) : item.atoms ?? []) as Atom[];
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
    const result = await safeMutate(
      () => updateScheduleEvent(item.id, { time: draft.time, endTime: draft.endTime ?? undefined, text: draft.text, atoms: draftAtoms }),
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
            {!atomPanelOpen && <ModalShell.Header title="Добавьте теги" onBack={handleClose} />}
            <ModalShell.AtomsBody>
              <AtomBuilder id={EDIT_MODAL_INPUT_IDS.ATOMS_INPUT} onPanelChange={setAtomPanelOpen} />
              {!atomPanelOpen && (
                <ModalShell.ActionButtons
                  right={<ModalNextButton onClick={handleCommit} variant="finish" />}
                />
              )}
            </ModalShell.AtomsBody>
          </ModalShell>
        }
      />
    </div>
  );
};

export default ScheduleEventEditModal;

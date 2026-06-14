import { useCallback, useEffect, useRef, useState } from 'react';
import { WriteBarShell, WriteBarClip, PlusIcon } from '@/shared/ui/WriteBarShell';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { addScheduleEvent } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';
import { AtomBuilder } from '@/widgets/ScheduleEvents/components/AtomBuilder';
import modalStyles from './ScheduleEventModals.module.scss';

const EVENT_DESCRIPTION_INPUT_ID = 'event-description-bar';

// Focus-hint shown in the centre above the bar (same affordance food uses). It
// migrates the old «Связь» preset chips: instead of a structured relation atom,
// the user is nudged to write the phenomenon AND its suspected cause straight
// into the text — which the analysis LLM mines (EVENTS_MINING_INSTRUCTION).
const EVENT_HINT = 'Например болела голова — похоже, из-за недосыпа';

type Props = {
  /** dd-MM-yyyy day to attach the event to. */
  scheduleId: string;
};

/**
 * Bottom write-bar for the Events screen (screen 3). Replaces the old
 * «Добавить событие» 3-step modal (2026-06-09):
 *  - plus glyph (left) → atoms picker (existing AtomBuilder in a ModalByLabel
 *    fullscreen modal — same shell the old flow used, restored 2026-06-09 on
 *    user request instead of a bottom-sheet Drawer);
 *  - field (center)   → «Описание»;
 *  - SEND             → creates the event = description + atoms + the CURRENT
 *    wall-clock time (captured at click), then clears (on success only).
 *
 * Description is bar-local; atoms live in the shared `useEventDraftStore`. Time is
 * NOT chosen here — edit it later via long-press. Works offline (local Dexie write).
 */
const EventsWriteBar = ({ scheduleId }: Props) => {
  const online = useOnline();
  const atoms = useEventDraftStore((st) => st.draft.atoms);
  const clearAtoms = useEventDraftStore((st) => st.clearAtoms);

  const [description, setDescription] = useState('');
  // Atoms modal: `atomsOpen` raises the ModalByLabel. Since the picker is now
  // Scale-only (AtomBuilder renders the scale form directly — no sub-panels),
  // the header + «Готово» footer are always shown.
  const [atomsOpen, setAtomsOpen] = useState(false);
  const submittingRef = useRef(false);

  // Reset on date change — the atoms draft is a global singleton, so clear it too
  // (otherwise atoms picked on one day leak into the next), and drop the modal.
  useEffect(() => {
    setDescription('');
    clearAtoms();
    setAtomsOpen(false);
    submittingRef.current = false;
  }, [scheduleId, clearAtoms]);

  const hasContent = description.trim().length > 0 || atoms.length > 0;

  // Open: seed the form from the existing scale atom (so re-opening shows/edits
  // it, not a blank 5), else a clean default. Close/«Готово»/Back: commit the
  // pending scale into atoms — a single button that never silently drops it.
  const openAtoms = useCallback(() => {
    const store = useEventDraftStore.getState();
    const scale = store.draft.atoms.find((a) => a.kind === 'scale');
    if (scale && scale.kind === 'scale') store.hydratePendingScale(scale);
    else store.resetPendingScale();
    setAtomsOpen(true);
  }, []);
  const closeAtoms = useCallback(() => {
    useEventDraftStore.getState().commitPendingScale();
    setAtomsOpen(false);
  }, []);

  // Lock the day-pager while the modal is open; route hardware/browser Back to
  // closing it instead of navigating away.
  useSwipeableLock(atomsOpen);
  useOverlayHistory(atomsOpen, closeAtoms);

  const handleSubmit = useCallback(
    async (desc: string): Promise<boolean> => {
      if (submittingRef.current) return false;
      const text = desc.trim();
      // Re-read atoms at submit time (avoid a stale closure after picking in the modal).
      const currentAtoms = useEventDraftStore.getState().draft.atoms;
      if (!text && currentAtoms.length === 0) return false;
      submittingRef.current = true;
      // Time = now AT SEND (not draft.time / focus time).
      const time = new Date().toTimeString().slice(0, 5);
      const result = await safeMutate(
        () =>
          addScheduleEvent({
            date: scheduleId,
            time,
            text: text || undefined,
            atoms: currentAtoms,
          }),
        'Не удалось создать событие'
      );
      submittingRef.current = false;
      // Clear ONLY on success — a failed write keeps the typed text + atoms, and
      // returning false keeps the bar focused (WriteBarShell.blurOnSubmit) so the
      // user can retry without re-tapping.
      if (!result.ok) return false;
      useRecentlyAddedStore.getState().addMany([result.value]);
      setDescription('');
      clearAtoms();
      return true;
    },
    [scheduleId, clearAtoms]
  );

  return (
    <>
      <WriteBarShell
        value={description}
        onChange={setDescription}
        onSubmit={handleSubmit}
        inputId={EVENT_DESCRIPTION_INPUT_ID}
        placeholder="Опишите событие"
        hint={EVENT_HINT}
        online={online}
        // After send: drop focus so the scrim/overlay dismisses (atoms already
        // cleared on success — once focus drops the badge reflects the reset).
        blurOnSubmit
        // Local write (offline-ok). Send shows on focus; enabled with a description
        // OR at least one atom (atoms-only / description-only events are both valid).
        computeSend={({ focused }) => ({ visible: focused, enabled: hasContent })}
        sendAriaLabel="Добавить событие"
        leftSlot={
          <WriteBarClip
            onClick={openAtoms}
            ariaLabel="Оценить состояние"
            count={atoms.length}
            icon={<PlusIcon />}
          />
        }
      />

      {/* Оценка — полноэкранная модалка (ModalShell + AtomBuilder в ModalByLabel).
          Scale-only: AtomBuilder рисует форму шкалы напрямую, поэтому шапка и
          «Готово» показаны всегда. Выбор пишется в draft-store живьём; «Готово» /
          стрелка-назад / системный Back просто закрывают. */}
      <ModalByLabel
        position="fixed"
        isExpanded={atomsOpen}
        content={
          <ModalShell variant="spring4" className={modalStyles.whiteShell}>
            <ModalShell.Header title="Оценка состояния" onBack={closeAtoms} backLabel="Закрыть" />
            <ModalShell.AtomsBody>
              {atomsOpen && <AtomBuilder />}
            </ModalShell.AtomsBody>
            <ModalShell.ActionButtons
              right={<ModalNextButton onClick={closeAtoms} variant="finish" />}
            />
          </ModalShell>
        }
      />
    </>
  );
};

export default EventsWriteBar;

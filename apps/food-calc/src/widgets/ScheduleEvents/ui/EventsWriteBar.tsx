import { useCallback, useEffect, useRef, useState } from 'react';
import { WriteBarShell, WriteBarClip, PlusIcon } from '@/shared/ui/WriteBarShell';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { addScheduleEvent } from '@/entities/schedule-event';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';
import { EventScalePanel } from './EventScalePanel';
import panelStyles from './EventScalePanel.module.scss';

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
 * Bottom write-bar for the Events screen (screen 3):
 *  - plus glyph (left) → toggles the inline scale panel (EventScalePanel), which
 *    rises into the keyboard's place below the bar — Telegram sticker-panel
 *    pattern (replaced the fullscreen ModalByLabel 2026-06-23);
 *  - field (center)   → «Описание»;
 *  - SEND             → creates the event = description + atoms + the CURRENT
 *    wall-clock time (captured at click), then clears (on success only).
 *
 * Description is bar-local; atoms live in the shared `useEventDraftStore`. Time is
 * NOT chosen here — edit it later via long-press. Works offline (local Dexie write).
 *
 * The bar + panel form one bottom-pinned `.stack`; the open/close slide and the
 * keyboard-lift (when a panel field is focused) compose into ONE transform on the
 * stack — see `EventScalePanel.module.scss`.
 */
const EventsWriteBar = ({ scheduleId }: Props) => {
  const online = useOnline();
  const atoms = useEventDraftStore((st) => st.draft.atoms);
  const clearAtoms = useEventDraftStore((st) => st.clearAtoms);

  const [description, setDescription] = useState('');
  // `atomsOpen` raises the inline scale panel. Scale-only: AtomBuilder renders the
  // scale form directly; closing commits the pending scale.
  const [atomsOpen, setAtomsOpen] = useState(false);
  const submittingRef = useRef(false);
  // Dock = bar + panel. While the panel is open, a field focused inside it raises
  // the keyboard; the shared hook lifts the whole dock above it (transform mode —
  // the dock is the bottom-pinned overlay inside a transformed Embla slide).
  const dockRef = useKeyboardStick<HTMLDivElement>({ mode: 'transform', enabled: atomsOpen });

  // Reset on date change — the atoms draft is a global singleton, so clear it too
  // (otherwise atoms picked on one day leak into the next), and drop the modal.
  useEffect(() => {
    setDescription('');
    clearAtoms();
    setAtomsOpen(false);
    submittingRef.current = false;
  }, [scheduleId, clearAtoms]);

  const hasContent = description.trim().length > 0 || atoms.length > 0;

  // Open: form starts EMPTY (a new state) — already-rated states show as chips in
  // the panel; tap a chip there to edit it. Drop the keyboard so the panel can
  // take its place (the swap). Close/Back/field-tap: commit the pending scale —
  // never silently drops it.
  const openAtoms = useCallback(() => {
    useEventDraftStore.getState().resetPendingScale();
    (document.getElementById(EVENT_DESCRIPTION_INPUT_ID) as HTMLElement | null)?.blur();
    setAtomsOpen(true);
  }, []);
  const closeAtoms = useCallback(() => {
    useEventDraftStore.getState().commitPendingScale();
    setAtomsOpen(false);
  }, []);
  // The «+» toggles the panel (open if closed, close if open) — like Telegram's
  // sticker button swapping with the keyboard.
  const toggleAtoms = useCallback(() => {
    if (atomsOpen) closeAtoms();
    else openAtoms();
  }, [atomsOpen, openAtoms, closeAtoms]);

  // Lock the day-pager while the panel is open; route hardware/browser Back to
  // closing it instead of navigating away.
  useSwipeableLock(atomsOpen);
  useOverlayHistory(atomsOpen, closeAtoms);

  // useKeyboardStick leaves its last inline transform when it disables, so clear
  // it once the panel closes — otherwise a keyboard-lift could stick on the bar.
  useEffect(() => {
    if (!atomsOpen) dockRef.current?.style.removeProperty('transform');
  }, [atomsOpen, dockRef]);

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
    <div className={panelStyles.dock} ref={dockRef}>
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
        // Swap-back: focusing the field while the panel is open closes it (and
        // brings the keyboard back), Telegram-style.
        onFieldFocus={atomsOpen ? closeAtoms : undefined}
        // Local write (offline-ok). Send shows on focus; enabled with a description
        // OR at least one atom (atoms-only / description-only events are both valid).
        computeSend={({ focused }) => ({ visible: focused, enabled: hasContent })}
        sendAriaLabel="Добавить событие"
        leftSlot={
          <WriteBarClip
            onClick={toggleAtoms}
            ariaLabel={atomsOpen ? 'Свернуть оценку' : 'Оценить состояние'}
            count={atoms.length}
            // Open → chevron-down (collapse affordance); closed → plus (add). The
            // chevron is the shared `›` glyph rotated to point down.
            icon={
              atomsOpen ? (
                <ChevronGlyph style={{ transform: 'rotate(90deg)' }} />
              ) : (
                <PlusIcon />
              )
            }
          />
        }
      />

      {/* Inline scale panel — mounted only while open; pushes the bar up. */}
      {atomsOpen && <EventScalePanel />}
    </div>
  );
};

export default EventsWriteBar;

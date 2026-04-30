/**
 * Input IDs used for label→input focus delegation across ScheduleEvent modals.
 *
 * Each modal step is opened by a <label htmlFor={ID}> that focuses the corresponding <input id={ID}>.
 * The onFocusCapture handler reads e.target.id to determine which step is active.
 *
 * ScheduleEventCreateModals:
 *   - TIME_INPUT → TimeChoose input (step: time)
 *   - TEXT_INPUT → Textarea for event text (step: text)
 *   - ATOMS_INPUT → AtomBuilder container (step: atoms)
 */
export const MODAL_INPUT_IDS = {
  TIME_INPUT: 'time-input-schedule-event',
  TEXT_INPUT: 'event-text',
  ATOMS_INPUT: 'event-atoms',
} as const;

/** Plus glyph — neutral «add» affordance for write bars. Shared by the
 *  Hypotheses bar (opens «Подробности») and the Events bar (opens «Оценка»).
 *  Inherits `currentColor`; sized + stroked to match the PaperclipIcon glyph.
 *  Replaced the bespoke NoteIcon / RateIcon glyphs (2026-06-13 user request:
 *  «просто иконка плюса» в обоих барах). */
export const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default PlusIcon;

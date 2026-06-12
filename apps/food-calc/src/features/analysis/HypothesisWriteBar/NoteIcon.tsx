/** Note glyph — left affordance for the Hypotheses write bar («подробности»).
 *  A document with a folded corner and two text lines = «add details (body)».
 *  Inherits `currentColor`; sized + stroked to match the other bar glyphs
 *  (PaperclipIcon / RateIcon). Distinct silhouette so the bars don't read alike. */
export const NoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 4.5h8l4 4v10a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18.5V6A1.5 1.5 0 0 1 6 4.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M14 4.5V8.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8 12.5h8M8 15.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export default NoteIcon;

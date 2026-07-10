import { memo } from 'react';

// Native date field. `<input type="date">` speaks the canonical `yyyy-MM-dd`
// for BOTH its `.value` and its `min`/`max` bounds, so no masking, parsing, or
// caret bookkeeping is needed — and on a phone it opens the OS date picker
// (wheel / calendar) instead of a numeric keypad. The visible format follows
// the OS locale (ru → дд.мм.гггг); the value the host sees stays ISO.
//
// Replaced the hand-rolled DD-MM-YYYY masked text input on 2026-07-05: that
// input dropped the caret on every mid-string edit and could sit in a
// «typed but not committed» state, so the window summary stuck on «Введи даты
// окна» even after the user had entered a date.
//
// Contract (unchanged from the masked input): `value` is `yyyy-MM-dd` (or ''
// when unset); `onChange` emits `yyyy-MM-dd` when a date is picked, '' when the
// field is cleared. The host still validates the span (7..35 days, end ≤ today).

type Props = {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  className?: string;
  /** Canonical `yyyy-MM-dd` lower bound for the native picker (optional). */
  min?: string;
  /** Canonical `yyyy-MM-dd` upper bound for the native picker (optional). */
  max?: string;
  'aria-label'?: string;
};

const NativeDateInput = ({ value, onChange, ...rest }: Props) => (
  <input
    type="date"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    data-base-ui-swipe-ignore
    {...rest}
  />
);

export default memo(NativeDateInput);

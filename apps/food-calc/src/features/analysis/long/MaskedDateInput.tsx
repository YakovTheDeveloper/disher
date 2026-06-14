import { memo, useEffect, useState } from 'react';
import { format, isValid, parse, parseISO } from 'date-fns';

// Manual date field in DD-MM-YYYY. A native <input type="date"> renders its
// display format from the OS/browser locale (en-US → MM/DD/YYYY) and can't be
// overridden — so we mask a plain text input ourselves and own the format.
//
// Contract: `value` is the canonical `yyyy-MM-dd` (or '' when unset/incomplete);
// `onChange` emits `yyyy-MM-dd` once 8 digits parse to a real date, else '' so
// the host's window validation sees an incomplete range.

const DISPLAY = 'dd-MM-yyyy';

function toDisplay(key: string): string {
  if (!key) return '';
  const d = parseISO(key);
  return isValid(d) ? format(d, DISPLAY) : '';
}

// Keep digits only, cap at 8, re-insert dashes after day and month.
function maskDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += '-' + digits.slice(2, 4);
  if (digits.length > 4) out += '-' + digits.slice(4, 8);
  return out;
}

type Props = {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  className?: string;
  'aria-label'?: string;
};

const MaskedDateInput = ({ value, onChange, id, className, ...rest }: Props) => {
  const [text, setText] = useState(() => toDisplay(value));

  // Reflect external value changes (default range) without clobbering a partial
  // in-progress entry: while typing we emit '', so `value` stays '' and the
  // formatted-current ('') equals it → the branch is skipped.
  useEffect(() => {
    const parsed = parse(text, DISPLAY, new Date());
    const current = isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : '';
    if (value !== current) setText(toDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskDigits(e.target.value);
    setText(masked);
    if (masked.length === 10) {
      const parsed = parse(masked, DISPLAY, new Date());
      onChange(isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : '');
    } else {
      onChange('');
    }
  }

  return (
    <input
      id={id}
      className={className}
      type="text"
      inputMode="numeric"
      placeholder="дд-мм-гггг"
      maxLength={10}
      value={text}
      onChange={handleChange}
      data-base-ui-swipe-ignore
      {...rest}
    />
  );
};

export default memo(MaskedDateInput);

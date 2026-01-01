// TimePicker.tsx
import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './TimePicker.module.scss';
import clsx from 'clsx';

const pad2 = (n: number) => String(n).padStart(2, '0');
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// helper: extract only digits from a string
const digits = (s: string) => (s || '').replace(/\D/g, '');

// parse common paste formats: "HHMM", "HH:MM", "H:MM", "HMM", "HHMMSS" -> we ignore seconds
function parseMaybeBoth(s: string): { hh?: string; mm?: string } {
  const d = digits(s);
  if (d.length >= 4) {
    return { hh: d.slice(0, 2), mm: d.slice(2, 4) };
  }
  if (d.length === 3) {
    // e.g. "123" -> "1","23"
    return { hh: d.slice(0, 1), mm: d.slice(1, 3) };
  }
  if (d.length === 2) {
    // ambiguous: could be HH or MM — treat as HH (user pasted "12")
    return { hh: d };
  }
  if (d.length === 1) {
    return { hh: d };
  }
  return {};
}

const normalize = (hhRaw: string, mmRaw: string) => {
  const hNum = hhRaw === '' ? 0 : clamp(Number(hhRaw), 0, 23);
  const mNum = mmRaw === '' ? 0 : clamp(Number(mmRaw), 0, 59);
  return `${pad2(hNum)}:${pad2(mNum)}`;
};

type Props = {
  value?: string; // "HH:MM" initial value
  onChange?: (value: string) => void; // on every normalized change
  onFinish?: (value: string) => void; // after minutes completed (and blurred)
  id?: string;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
  hours: string; // "HH" initial value
  minutes: string; // "MM" initial value
  setHours: (value: string) => void;
  setMinutes: (value: string) => void;
};

const TimePicker = observer((props: Props) => {
  const {
    hours,
    minutes,
    setHours,
    setMinutes,
    onChange,
    onFinish,
    id,
    hourAriaLabel = 'Hour',
    minuteAriaLabel = 'Minute',
  } = props;

  // controlled-ish initial parse
  // const [initH, initM] = (value || '00:00').split(':');
  // const [hours, setHours] = useState<string>(initH === undefined ? '' : initH.replace(/\D/g, ''));
  // const [minutes, setMinutes] = useState<string>(
  //   initM === undefined ? '' : initM.replace(/\D/g, '')
  // );

  const hhRef = useRef<HTMLInputElement | null>(null);
  const mmRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep parent informed whenever normalized value changes
  // useEffect(() => {
  //   onChange?.(normalize(hours || '0', minutes || '0'));
  // }, [hours, minutes, onChange]);

  // focus container -> focus hours (and select)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      // ignore clicks that landed on inputs themselves
      if (hhRef.current && hhRef.current.contains(e.target as Node)) return;
      if (mmRef.current && mmRef.current.contains(e.target as Node)) return;
      // focus hours and select
      hhRef.current?.focus();
      hhRef.current?.select();
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, []);

  // helper to finish minutes and blur
  const finishAndBlur = (h: string, m: string) => {
    const norm = normalize(h || '0', m || '0');
    onChange?.(norm);
    onFinish?.(norm);
    mmRef.current?.blur();
  };

  // HANDLERS
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = digits(e.target.value);

    // ограничиваем максимум 2 цифры
    const raw = rawDigits.slice(0, 2);

    // если пользователь вставил "12:34" или "1234" — обрабатываем как раньше
    const pasted = parseMaybeBoth(e.target.value);
    if (pasted.hh !== undefined && pasted.mm !== undefined && rawDigits.length >= 3) {
      const hh = pad2(clamp(Number(pasted.hh), 0, 23));
      const mm = pad2(clamp(Number(pasted.mm), 0, 59));
      setHours(hh);
      setMinutes(mm);
      onChange?.(`${hh}:${mm}`);
      onFinish?.(`${hh}:${mm}`);
      mmRef.current?.blur();
      return;
    }

    // ===================
    // 24-hour smart logic
    // ===================
    if (raw.length === 1) {
      const d = Number(raw);

      if (d >= 3) {
        // impossible for HH — auto-complete to 0d and jump
        const hh = pad2(d);
        setHours(hh);

        requestAnimationFrame(() => {
          mmRef.current?.focus();
          mmRef.current?.select();
        });
        return;
      }

      // if 0,1,2 — wait for next digit (normal behavior)
      setHours(raw);
      return;
    }

    if (raw.length === 2) {
      // limit hours 0–23
      const fixed = pad2(clamp(Number(raw), 0, 23));
      setHours(fixed);

      // auto jump to minutes
      requestAnimationFrame(() => {
        mmRef.current?.focus();
        mmRef.current?.select();
      });
      return;
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = digits(e.target.value).slice(0, 2);

    // handle paste that included both values (e.g. user pasted "1234" into minutes)
    const pasted = parseMaybeBoth(e.target.value);
    if (pasted.hh !== undefined && pasted.mm !== undefined && digits(e.target.value).length >= 3) {
      const hh = pad2(clamp(Number(pasted.hh), 0, 23));
      const mm = pad2(clamp(Number(pasted.mm), 0, 59));
      setHours(hh);
      setMinutes(mm);
      onChange?.(`${hh}:${mm}`);
      onFinish?.(`${hh}:${mm}`);
      mmRef.current?.blur();
      return;
    }

    setMinutes(raw);

    if (raw.length === 2) {
      const mmFormatted = pad2(clamp(Number(raw), 0, 59));
      setMinutes(mmFormatted);
      // finish
      window.requestAnimationFrame(() => finishAndBlur(hours || '0', mmFormatted));
    }
  };

  // Backspace / navigation behaviour
  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      mmRef.current?.focus();
      mmRef.current?.select();
    }
  };

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      hhRef.current?.focus();
      hhRef.current?.select();
      return;
    }
    if (e.key === 'Backspace') {
      // if minutes empty or caret at start -> go to hours and delete last char
      const target = e.target as HTMLInputElement;
      const selStart = target.selectionStart ?? 0;
      const selEnd = target.selectionEnd ?? 0;
      if (minutes.length === 0 || (selStart === 0 && selEnd === 0)) {
        e.preventDefault();
        // move focus to hours and remove last char
        hhRef.current?.focus();
        // remove last character from hours
        setHours((prev) => prev.slice(0, -1));
        // place caret at end
        requestAnimationFrame(() => {
          const hh = hhRef.current;
          if (hh) {
            const len = hh.value.length;
            hh.setSelectionRange(len, len);
          }
        });
      }
    }
  };

  // blur logic: if minute blurred but has 1 digit or 0 -> normalize & call onFinish (useful for keyboard navigation)
  const handleMinutesBlur = () => {
    if (minutes.length > 0 && minutes.length < 2) {
      const mmFormatted = pad2(clamp(Number(minutes || '0'), 0, 59));
      setMinutes(mmFormatted);
      const norm = normalize(hours || '0', mmFormatted);
      onChange?.(norm);
      onFinish?.(norm);
    } else if (minutes.length === 0) {
      // if minutes left empty on blur, still normalize to 00 but do not call onFinish necessarily
      setMinutes('00');
      onChange?.(normalize(hours || '0', '00'));
    }
  };

  // blur hours: if one digit, leave it as-is (not pad) but if user leaves entirely maybe pad? We'll pad on finishing minutes.
  const handleHoursBlur = () => {
    if (hours.length === 0) {
      setHours('00');
      onChange?.(normalize('00', minutes || '00'));
    } else if (hours.length === 1) {
      // keep single digit visually, but ensure change emitted in normalized form
      // do not auto-jump to minutes here
      onChange?.(normalize(hours, minutes || '00'));
    }
  };

  // expose a way to programmatically set focus externally? not needed for now

  return (
    <div
      ref={containerRef}
      id={id}
      className={clsx([styles.container])}
      role="group"
      aria-label="Time input"
      // keep cursor text when hover
      style={{ cursor: 'text', display: 'inline-flex', alignItems: 'center' }}
    >
      <div className={styles.inner}>
        <input
          ref={hhRef}
          className={styles.input}
          aria-label={hourAriaLabel}
          placeholder="hh"
          inputMode="numeric"
          pattern="[0-9]*"
          value={hours}
          onChange={handleHoursChange}
          onKeyDown={handleHoursKeyDown}
          onBlur={handleHoursBlur}
          maxLength={2}
          // select on focus to make overwriting fast
          onFocus={(e) => e.currentTarget.select()}
        />
        <span aria-hidden style={{ padding: '0 1px' }}>
          :
        </span>
        <input
          ref={mmRef}
          className={styles.input}
          aria-label={minuteAriaLabel}
          placeholder="mm"
          inputMode="numeric"
          pattern="[0-9]*"
          value={minutes}
          onChange={handleMinutesChange}
          onKeyDown={handleMinutesKeyDown}
          onBlur={handleMinutesBlur}
          maxLength={2}
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>
    </div>
  );
});

export default TimePicker;

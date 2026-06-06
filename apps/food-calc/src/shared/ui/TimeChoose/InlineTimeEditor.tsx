import { memo, useEffect, useState } from 'react';
import clsx from 'clsx';
import TimeInput from './TimeInput';
import { normalizeTime } from './time-utils';
import styles from './InlineTimeEditor.module.scss';

type Props = {
  value: string; // "HH:MM"
  onCommit: (next: string) => void; // fires only when value actually changes
  className?: string;
  displayClassName?: string;
  editClassName?: string;
};

/**
 * Inline time editor: click on display → edit, blur/Enter/4 digits → commit.
 *
 * Owns hours/minutes state internally while editing. Display reads `value`
 * directly, so the parent has a single source of truth (the persisted string).
 * onCommit fires at most once per edit session, only if the value changed.
 */
const InlineTimeEditor = ({
  value,
  onCommit,
  className,
  displayClassName,
  editClassName,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(() => value.split(':')[0] ?? '00');
  const [minutes, setMinutes] = useState(() => value.split(':')[1] ?? '00');
  // After commit we keep showing the local edit until parent's `value` catches up.
  // Otherwise PowerSync's round-trip causes a brief flash of the old `value`.
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (editing) return;
    setHours(value.split(':')[0] ?? '00');
    setMinutes(value.split(':')[1] ?? '00');
  }, [value, editing]);

  useEffect(() => {
    if (pending !== null && pending === value) setPending(null);
  }, [pending, value]);

  const commitTime = (time: string) => {
    const normalized = time || normalizeTime(hours, minutes);
    if (normalized === value) return;
    setPending(normalized);
    onCommit(normalized);
  };

  if (!editing) {
    return (
      <span
        className={clsx(styles.display, displayClassName, className)}
        onClick={() => setEditing(true)}
      >
        {pending ?? value}
      </span>
    );
  }

  return (
    <span
      className={clsx(styles.edit, editClassName, className)}
      // Глобальный хук для Screen: пока редактируется инлайн-поле сущности,
      // нижний бар прячется (`Screen.module.scss` :has([data-entity-edit]…)).
      data-entity-edit
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setHours(value.split(':')[0] ?? '00');
          setMinutes(value.split(':')[1] ?? '00');
          setEditing(false);
        }
      }}
      onBlur={(e) => {
        const wrapper = e.currentTarget;
        setTimeout(() => {
          const ae = document.activeElement as HTMLElement | null;
          if (wrapper.contains(ae)) return;
          setEditing(false);
        }, 0);
      }}
    >
      <TimeInput
        variant="manual"
        hours={hours}
        minutes={minutes}
        setHours={setHours}
        setMinutes={setMinutes}
        onFinish={commitTime}
        autoFocus
      />
    </span>
  );
};

export default memo(InlineTimeEditor);

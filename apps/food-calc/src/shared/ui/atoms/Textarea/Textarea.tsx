import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
  rows?: number;
  maxLength?: number;
  debounceTime?: number;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  autoFocus?: boolean;
  id?: string;
}

function resize(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

const Textarea = ({
  value,
  onChange,
  placeholder,
  label,
  rows = 1,
  maxLength,
  debounceTime = 300,
  className,
  disabled,
  required,
  readOnly,
  name,
  autoFocus,
  id: propId,
}: TextareaProps) => {
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external → local
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Auto-resize on content change
  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, [local]);

  // Re-measure when parent container resizes (handles ModalByLabel expand/collapse)
  useEffect(() => {
    const el = ref.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const ro = new ResizeObserver(() => resize(el));
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Debounced onChange
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      if (maxLength && next.length > maxLength) return;
      setLocal(next);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(next), debounceTime);
    },
    [onChange, debounceTime, maxLength],
  );

  // Cleanup timer
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const textareaId = propId || undefined;

  return (
    <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
      {label && (
        <label className={styles.label} htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={styles.textarea}
        aria-label={typeof label === 'string' ? label : placeholder}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        name={name}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default Textarea;

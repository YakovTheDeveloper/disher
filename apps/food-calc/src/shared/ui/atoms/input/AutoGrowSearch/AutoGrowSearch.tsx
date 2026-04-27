import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import styles from './AutoGrowSearch.module.scss';

type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'rows' | 'onSubmit'
>;

export interface AutoGrowSearchProps extends TextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  maxRows?: number;
  collapseOnBlur?: boolean;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}

export const AutoGrowSearch = forwardRef<HTMLTextAreaElement, AutoGrowSearchProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      placeholder = 'Search',
      maxRows = 6,
      collapseOnBlur = true,
      startAdornment,
      endAdornment,
      className,
      onKeyDown,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    const recomputeRows = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = '0';
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 22;
      const next = Math.min(Math.max(1, Math.floor(el.scrollHeight / lineHeight)), maxRows);
      if (el.rows !== next) el.rows = next;
      el.style.height = '';
    }, [maxRows]);

    useEffect(() => {
      recomputeRows();
    }, [value, recomputeRows]);

    const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
      onChange(e.currentTarget.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.(value);
      }
      onKeyDown?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (collapseOnBlur && innerRef.current) {
        innerRef.current.rows = 1;
      }
      onBlur?.(e);
    };

    return (
      <div className={[styles.shell, className].filter(Boolean).join(' ')}>
        {startAdornment && <span className={styles.adornment}>{startAdornment}</span>}
        <textarea
          {...rest}
          ref={innerRef}
          rows={1}
          value={value}
          placeholder={placeholder}
          onInput={handleInput}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={styles.field}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        {endAdornment && <span className={styles.adornment}>{endAdornment}</span>}
      </div>
    );
  }
);

AutoGrowSearch.displayName = 'AutoGrowSearch';

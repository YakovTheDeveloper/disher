import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type FocusEvent,
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
      onFocus,
      spellCheck,
      autoCorrect,
      autoCapitalize,
      ...rest
    },
    ref
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const lineHeightRef = useRef(0);
    useImperativeHandle(ref, () => innerRef.current!, []);

    const recomputeRows = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      if (!lineHeightRef.current) {
        const parsed = parseFloat(getComputedStyle(el).lineHeight);
        lineHeightRef.current = Number.isFinite(parsed) && parsed > 0 ? parsed : 22;
      }
      el.style.height = '0';
      const next = Math.min(
        Math.max(1, Math.floor(el.scrollHeight / lineHeightRef.current)),
        maxRows
      );
      if (el.rows !== next) el.rows = next;
      el.style.height = '';
    }, [maxRows]);

    useEffect(() => {
      recomputeRows();
    }, [value, recomputeRows]);

    useEffect(() => {
      const el = innerRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return;
      let lastWidth = Math.round(el.clientWidth);
      const ro = new ResizeObserver((entries) => {
        const w = Math.round(entries[0]?.contentRect.width ?? 0);
        if (w !== lastWidth) {
          lastWidth = w;
          recomputeRows();
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [recomputeRows]);

    const handleInput = (e: FormEvent<HTMLTextAreaElement>) => {
      onChange(e.currentTarget.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        onSubmit &&
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault();
        onSubmit(value);
      }
      onKeyDown?.(e);
    };

    const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
      recomputeRows();
      onFocus?.(e);
    };

    const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
      if (collapseOnBlur && value === '' && innerRef.current) {
        innerRef.current.rows = 1;
      }
      onBlur?.(e);
    };

    return (
      <div className={[styles.shell, className].filter(Boolean).join(' ')}>
        {startAdornment && <span className={styles.adornment}>{startAdornment}</span>}
        <textarea
          spellCheck={spellCheck ?? false}
          autoCorrect={autoCorrect ?? 'off'}
          autoCapitalize={autoCapitalize ?? 'off'}
          {...rest}
          ref={innerRef}
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={styles.field}
        />
        {endAdornment && <span className={styles.adornment}>{endAdornment}</span>}
      </div>
    );
  }
);

AutoGrowSearch.displayName = 'AutoGrowSearch';

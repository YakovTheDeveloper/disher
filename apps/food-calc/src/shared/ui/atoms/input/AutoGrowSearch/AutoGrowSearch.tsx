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
  /**
   * Single-line mode: the field never grows past one row, text does not wrap
   * (it scrolls horizontally like an `<input>`), and Enter never inserts a
   * newline — it submits via `onSubmit` if provided, otherwise it is a no-op.
   * Use for name/tag fields; omit for free-form note fields.
   */
  singleLine?: boolean;
  /**
   * Rich placeholder overlay (e.g. a styled first word). Rendered as an
   * `aria-hidden` layer over the field, visible only while it is empty
   * (`:placeholder-shown`). The native `placeholder` string is kept for screen
   * readers and emptiness detection, but painted transparent — this node draws
   * the visible, partially-styled version on top. The internal wrapper stays
   * `display:contents` until this is set, so consumers that don't use it keep an
   * identical box tree. Assumes no `startAdornment`/`endAdornment` overlap.
   */
  renderPlaceholder?: ReactNode;
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
      singleLine = false,
      renderPlaceholder,
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
      const cap = singleLine ? 1 : maxRows;
      const next = Math.min(
        Math.max(1, Math.floor(el.scrollHeight / lineHeightRef.current)),
        cap
      );
      if (el.rows !== next) el.rows = next;
      el.style.height = '';
    }, [maxRows, singleLine]);

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
      const isEnter =
        e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing;
      // Single-line: Enter must never insert a newline. Submit if a handler
      // exists, otherwise just swallow the keystroke.
      if (isEnter && (onSubmit || singleLine)) {
        e.preventDefault();
        onSubmit?.(value);
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
      <div
        className={[
          styles.shell,
          renderPlaceholder ? styles.hasRichPlaceholder : null,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {startAdornment && <span className={styles.adornment}>{startAdornment}</span>}
        {/* display:contents until a rich placeholder is present (see SCSS), so
            adornment-less consumers keep the textarea as a direct flex child. */}
        <div className={styles.fieldWrap}>
          <textarea
            spellCheck={spellCheck ?? false}
            autoCorrect={autoCorrect ?? 'off'}
            autoCapitalize={autoCapitalize ?? 'off'}
            data-base-ui-swipe-ignore=""
            {...rest}
            ref={innerRef}
            rows={1}
            value={value}
            placeholder={placeholder}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={[styles.field, singleLine && styles.fieldSingleLine]
              .filter(Boolean)
              .join(' ')}
          />
          {renderPlaceholder && (
            <span className={styles.richPlaceholder} aria-hidden="true">
              {renderPlaceholder}
            </span>
          )}
        </div>
        {endAdornment && <span className={styles.adornment}>{endAdornment}</span>}
      </div>
    );
  }
);

AutoGrowSearch.displayName = 'AutoGrowSearch';

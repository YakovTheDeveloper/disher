import { useCallback, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import s from './WriteBarShell.module.scss';

// Shared palette anchor — all three write bars (food / analysis / events) flip
// together so the family stays visually 1:1 (decision 2026-06-09).
const DEFAULT_VARIANTS = ['ash', 'mint'] as const;

const SendArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    {/* Optically centred: an arrow's visual weight sits toward the head, so the
        glyph is nudged right ~0.4 to read as centred inside the circle. Slightly
        shorter shaft + a hair bolder stroke balance it at the coin's size. */}
    <g transform="translate(0.4 0)">
      <path
        d="M3.7 9h9.6M9.3 4.8 13.7 9 9.3 13.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

// First word → serif-italic accent (canon --heading-font); rest plain. Split on
// the first space; leading space of the remainder is preserved.
function renderAccent(text: string): ReactNode {
  const spaceIdx = text.indexOf(' ');
  if (spaceIdx === -1) return text;
  return (
    <>
      <em className={s.placeholderAccent}>{text.slice(0, spaceIdx)}</em>
      {text.slice(spaceIdx)}
    </>
  );
}

function renderHint(text: string): ReactNode {
  const spaceIdx = text.indexOf(' ');
  if (spaceIdx === -1) return text;
  return (
    <>
      <em className={s.focusHintAccent}>{text.slice(0, spaceIdx)}</em>
      {text.slice(spaceIdx)}
    </>
  );
}

// iOS Safari: native scroll-on-focus for a docked input is unreliable. Listen
// for the real signal — `visualViewport.resize` (keyboard raised) — instead of
// a magic timeout. See the original WriteFoodInput note.
const KEYBOARD_OPEN_RATIO = 0.85;
const KEYBOARD_FALLBACK_MS = 500;

function scrollInputAboveKeyboard(target: HTMLElement) {
  const doScroll = () => {
    target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
  };
  const vv = window.visualViewport;
  if (!vv) {
    doScroll();
    return;
  }
  if (vv.height < window.innerHeight * KEYBOARD_OPEN_RATIO) {
    doScroll();
    return;
  }
  const onResize = () => {
    cleanup();
    doScroll();
  };
  const fallback = window.setTimeout(() => {
    cleanup();
    doScroll();
  }, KEYBOARD_FALLBACK_MS);
  const cleanup = () => {
    vv.removeEventListener('resize', onResize);
    window.clearTimeout(fallback);
  };
  vv.addEventListener('resize', onResize, { once: true });
}

export type SendState = { visible: boolean; enabled: boolean };

export interface WriteBarShellProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * Fired by Enter and the send button — only when the computed send is enabled.
   * Return `false` (or a Promise resolving to `false`) to signal failure: with
   * `blurOnSubmit` set, focus is then KEPT so the user can retry. Any other
   * return (void / true) blurs on success.
   */
  onSubmit: (value: string) => void | boolean | Promise<void | boolean>;
  inputId: string;
  placeholder: string;
  /** Serif-accent the first placeholder word. Default true. */
  accentPlaceholder?: boolean;
  maxLength?: number;
  /** Rows the field grows to on focus. Default 4. */
  maxRowsFocused?: number;
  readOnly?: boolean;
  online: boolean;
  /**
   * Decide whether the send button shows / is enabled. Default = WriteFoodInput
   * behaviour (`visible: expanded && hasText`, `enabled: online && hasText`).
   * Analysis/Events override (message optional, etc.).
   */
  computeSend?: (ctx: { focused: boolean; hasText: boolean; online: boolean }) => SendState;
  /** Render a spinner in the send slot instead of the button (loading). */
  busy?: boolean;
  sendAriaLabel?: string;
  /** Affordance before the field, inside the pill (e.g. paperclip). Never collapses. */
  leftSlot?: ReactNode;
  /** Affordance after the field (medal / arc). Collapses on focus. */
  rightSlot?: ReactNode;
  /** Replaces the entire input field (e.g. Food ready-state CTA). Forces collapsed. */
  fieldOverride?: ReactNode;
  hint?: string;
  /** Value for `data-write-state` on the wrap (external hooks). */
  writeState?: string;
  className?: string;
  designVariant?: { key: string; variants: readonly string[] };
  /** After a successful submit, smooth-scroll to this selector. */
  scrollToOnSubmit?: string;
  /**
   * Blur the input right after submit so the focus-scrim / expanded state drops
   * and the bar collapses (Events/Analysis: send → dismiss). Food keeps focus to
   * flow into its loading → ready-state, so it leaves this off.
   */
  blurOnSubmit?: boolean;
  /**
   * Opt-in: the pill's fill + border dissolve toward the right end (near the
   * medal), so the pill «opens» toward it. Only the food bar (WriteFoodInput)
   * uses this; Analysis/Events keep a plain even border.
   */
  fadeRight?: boolean;
}

/**
 * Shared messenger-style write bar: optional left affordance + AutoGrowSearch +
 * send button + optional right medal. Owns focus/expand, keyboard-scroll, press
 * feedback, and the design-variant palette. Consumers wire data + send predicate.
 */
export const WriteBarShell = ({
  value,
  onChange,
  onSubmit,
  inputId,
  placeholder,
  accentPlaceholder = true,
  maxLength,
  maxRowsFocused = 4,
  readOnly,
  online,
  computeSend,
  busy = false,
  sendAriaLabel,
  leftSlot,
  rightSlot,
  fieldOverride,
  hint,
  writeState,
  className,
  designVariant,
  scrollToOnSubmit,
  blurOnSubmit = false,
  fadeRight = false,
}: WriteBarShellProps) => {
  const { pressed: barPressed, pressProps: barPressProps } = usePressFeedback();
  const { anchor } = useDesignVariant(
    designVariant?.key ?? 'WriteBar',
    designVariant?.variants ?? DEFAULT_VARIANTS,
  );

  const [focused, setFocused] = useState(false);

  const expanded = focused && !fieldOverride;
  const hasText = value.trim().length > 0;

  const send: SendState = computeSend
    ? computeSend({ focused: expanded, hasText, online })
    : { visible: expanded && hasText, enabled: online && hasText };

  const showSpinner = busy;
  const showSend = !busy && send.visible;

  const handleSubmit = useCallback(() => {
    if (!send.enabled) return;
    const result = onSubmit(value);
    if (blurOnSubmit) {
      // Blur ONLY on success → onBlur collapses the bar, the Screen
      // `:has(...:focus)` scrim fades, the keyboard dismisses. The send button's
      // preventDefault kept focus through the click; we release it once the
      // (possibly async) submit resolves to anything other than `false`. A
      // `false` result (e.g. a failed write) keeps focus for a retry.
      void Promise.resolve(result).then((ok) => {
        if (ok !== false) {
          (document.getElementById(inputId) as HTMLElement | null)?.blur();
        }
      });
    }
    if (scrollToOnSubmit) {
      requestAnimationFrame(() => {
        document
          .querySelector(scrollToOnSubmit)
          ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    }
  }, [send.enabled, onSubmit, value, scrollToOnSubmit, blurOnSubmit, inputId]);

  return (
    <div
      {...anchor}
      className={clsx(s.wrap, className)}
      data-write-state={writeState}
      // Marker for the Screen focus-scrim (`:has([data-write-bar] textarea:focus)`).
      data-write-bar=""
    >
      {hint ? (
        <div className={s.focusHint} data-visible={expanded || undefined} aria-hidden="true">
          {renderHint(hint)}
        </div>
      ) : null}
      <div
        className={s.writeBarRow}
        data-expanded={expanded || undefined}
        data-pressed={barPressed || undefined}
        data-has-left={leftSlot ? '' : undefined}
        data-fade-right={fadeRight ? '' : undefined}
      >
        {leftSlot}
        {fieldOverride ?? (
          <div
            className={clsx(s.writeField, s.writeBarInput)}
            data-state={busy ? 'loading' : 'idle'}
            {...barPressProps}
          >
            <div className={s.writeFieldRow}>
              <AutoGrowSearch
                id={inputId}
                value={value}
                onChange={onChange}
                onSubmit={handleSubmit}
                onFocus={(e) => {
                  setFocused(true);
                  scrollInputAboveKeyboard(e.currentTarget);
                }}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                renderPlaceholder={accentPlaceholder ? renderAccent(placeholder) : undefined}
                maxRows={focused ? maxRowsFocused : 1}
                maxLength={maxLength}
                collapseOnBlur={false}
                className={s.writeFieldInput}
                readOnly={readOnly}
              />
            </div>
          </div>
        )}
        {/* Right slot = medal (collapses on focus). The send / spinner sits in the
            SAME slot as a coin of the medal's footprint: on focus the medal
            collapses and the send coin takes its place. */}
        {rightSlot}
        {showSpinner ? (
          <div className={s.sendCoin} data-busy="" role="status" aria-label="Загрузка">
            <Spinner size={22} />
          </div>
        ) : showSend ? (
          <button
            type="button"
            className={s.sendCoin}
            // preventDefault keeps focus: a tap would otherwise blur the input →
            // collapse → unmount the coin before the click lands.
            onPointerDown={(e) => e.preventDefault()}
            onClick={handleSubmit}
            disabled={!send.enabled}
            aria-label={online ? (sendAriaLabel ?? 'Отправить') : 'Нет сети'}
          >
            <SendArrowIcon />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default WriteBarShell;

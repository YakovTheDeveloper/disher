import { useCallback, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import s from './WriteBarShell.module.scss';

// Поверхность бара ЗАФИКСИРОВАНА на `frost` (2026-06-24) — выбор сделан, живой
// 🎨-перебор `WriteBarSurface` больше не нужен. Раньше это был DesignBar-анкор
// (field/cta/bright/frost); теперь атрибуты `data-dv*` проставлены статически на
// `.wrap`, поэтому CSS-гейт `[data-dv='WriteBarSurface'][data-dv-v='frost']`
// (внизу WriteBarShell.module.scss) применяется всегда, а сам ключ из бара ушёл
// (useDesignVariant больше не регистрируется). Остальные форки (field/cta/bright)
// в scss мёртвы — выпилить вместе с гейтом отдельным проходом.

// Минималистичный «бумажный самолётик» — канон send-иконки (Telegram-стиль,
// уже стандарт мессенджер-инпута). Залит currentColor (на тёмной монете читается
// белым). Заменил прежнюю стрелку 2026-06-23: усиливает айдентику «отправить».
const SendPlaneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
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
  /**
   * Affordance AFTER the pill, as a detached sibling (medal / arc). It sits
   * OUTSIDE the glass pill, kept in place at the far right; the pill shrinks to
   * end before it (food bar). Collapses on focus so the pill takes its place.
   */
  rightSlot?: ReactNode;
  /** Replaces the entire input field (e.g. Food ready-state CTA). Forces collapsed. */
  fieldOverride?: ReactNode;
  hint?: string;
  /** Value for `data-write-state` on the wrap (external hooks). */
  writeState?: string;
  className?: string;
  /** After a successful submit, smooth-scroll to this selector. */
  scrollToOnSubmit?: string;
  /**
   * Blur the input right after submit so the focus-scrim / expanded state drops
   * and the bar collapses (Events/Analysis: send → dismiss). Food keeps focus to
   * flow into its loading → ready-state, so it leaves this off.
   */
  blurOnSubmit?: boolean;
  /**
   * Fired when the text field gains focus. Events uses it for the inline
   * scale-panel swap-back: tapping the field closes the panel and brings the
   * keyboard back. Runs alongside the internal keyboard-scroll.
   */
  onFieldFocus?: () => void;
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
  scrollToOnSubmit,
  blurOnSubmit = false,
  onFieldFocus,
}: WriteBarShellProps) => {
  const { pressed: barPressed, pressProps: barPressProps } = usePressFeedback();

  const [focused, setFocused] = useState(false);

  const expanded = focused && !fieldOverride;
  const hasText = value.trim().length > 0;

  const send: SendState = computeSend
    ? computeSend({ focused: expanded, hasText, online })
    : { visible: expanded && hasText, enabled: online && hasText };

  const showSpinner = busy;
  // Постоянная иконка «отправить» (предложка 2026-06-23): рендерим всегда, пока
  // есть поле и нет загрузки — disabled, пока send не enabled. Усиливает айдентику
  // мессенджер-инпута (раньше пряталась до фокуса+текста через send.visible).
  const showSend = !busy && !fieldOverride;

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
      // Поверхность залочена на `frost` (см. шапку файла) — статический гейт.
      data-dv="WriteBarSurface"
      data-dv-v="frost"
      className={clsx(s.wrap, className)}
      data-write-state={writeState}
      // Marker for the Screen focus-scrim (`:has([data-write-bar] textarea:focus)`).
      data-write-bar=""
    >
      {hint ? (
        <div className={s.focusHint} data-visible={expanded || undefined} aria-hidden="true">
          <span className={s.focusHintInner}>{renderHint(hint)}</span>
        </div>
      ) : null}
      {/* barLine = flex row of the glass pill + the detached medal sibling.
          `data-expanded` rides here (not only the pill) so the medal — now
          OUTSIDE the pill — still reads the collapse state cross-module.
          `data-detached` (rightSlot present = food medal) mirrors the medal's
          footprint as a left margin on the pill, so the pill sits dead-centre on
          screen regardless of the medal sitting at the right. */}
      <div
        className={s.barLine}
        data-expanded={expanded || undefined}
        data-detached={rightSlot ? '' : undefined}
      >
        <div
          className={s.writeBarRow}
          data-expanded={expanded || undefined}
          data-pressed={barPressed || undefined}
          data-has-left={leftSlot ? '' : undefined}
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
                    onFieldFocus?.();
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
          {/* Send / spinner lives INSIDE the pill, at its right edge. Persistent
              (предложка 2026-06-23): the coin always shows while a field is present
              — disabled until send is enabled — to read as a messenger send button.
              The detached medal floats above it (collapses on focus). */}
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
              <SendPlaneIcon />
            </button>
          ) : null}
        </div>
        {/* Detached medal — sits OUTSIDE the pill, kept in place at the far right.
            Collapses on focus (reads `[data-expanded]` off `.barLine`). */}
        {rightSlot}
      </div>
    </div>
  );
};

export default WriteBarShell;

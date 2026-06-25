import { useCallback, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { Text, QuietLabel } from '@/shared/ui/atoms/Typography';
import { RotatingPlaceholder } from './RotatingPlaceholder';
import s from './WriteBarShell.module.scss';

// Поверхность бара = стандартное поле формы проекта (warm well + внутренняя тень)
// со скруглением пилюли (--radius-full), на приподнятой док-подложке. Мёртвый
// DesignBar-анкор `WriteBarSurface` (field/cta/bright/frost) и статические
// `data-dv*` выпилены 2026-06-24 — свойства живут в базовых классах
// WriteBarShell.module.scss.

// Минималистичный «бумажный самолётик» — канон send-иконки (Telegram-стиль,
// уже стандарт мессенджер-инпута). Залит currentColor (на тёмной монете читается
// белым). Заменил прежнюю стрелку 2026-06-23: усиливает айдентику «отправить».
const SendPlaneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

function renderHint(text: string): ReactNode {
  const spaceIdx = text.indexOf(' ');
  if (spaceIdx === -1) return text;
  return (
    <>
      <QuietLabel as="em" className={s.focusHintAccent}>
        {text.slice(0, spaceIdx)}
      </QuietLabel>
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
  /**
   * Стабильный нативный placeholder (для скринридера + `:placeholder-shown`).
   * Виден как обычный плейсхолдер, когда карусель примеров не активна.
   */
  placeholder: string;
  /**
   * Строки-примеры для анимированной карусели в ПУСТОМ баре (см.
   * RotatingPlaceholder). Карусель показывается только когда есть примеры И
   * `examplesActive` (инпут пуст И список айтемов пуст). Иначе виден обычный
   * `placeholder`.
   */
  placeholderExamples?: string[];
  /**
   * Caller-гейт «список айтемов пуст» (онбординг-подсказка для свежего экрана).
   * Часть условия показа карусели; вторую часть («инпут пуст») бар считает сам.
   * Default true (если consumer не управляет списком — крутим, когда есть примеры).
   */
  examplesActive?: boolean;
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
  placeholderExamples,
  examplesActive = true,
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

  // Карусель примеров: монтируется, когда переданы примеры И caller-гейт
  // `examplesActive` (список айтемов пуст). Сам цикл крутится только пока инпут
  // пуст (`active={!hasText}`); как только появляется текст — оверлей всё равно
  // прячется CSS-ом `:placeholder-shown`, а цикл замирает.
  const showExamples = !fieldOverride && !!placeholderExamples?.length && examplesActive;

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
      className={clsx(s.wrap, className)}
      data-write-state={writeState}
      // `data-expanded` rides the wrap so the detached medal — now a wrap-level
      // sibling of `.barLine` (moved out 2026-06-25 so it floats at the screen
      // edge while the pill takes the wrap's side inset) — still reads collapse.
      data-expanded={expanded || undefined}
      // Marker for the Screen focus-scrim (`:has([data-write-bar] textarea:focus)`).
      data-write-bar=""
    >
      {hint ? (
        <div className={s.focusHint} data-visible={expanded || undefined} aria-hidden="true">
          <Text as="span" role="caption" className={s.focusHintInner}>
            {renderHint(hint)}
          </Text>
        </div>
      ) : null}
      {/* barLine = the glass pill row (left slot + field + send). The medal is no
          longer here — it moved up to `.wrap` (below) so it anchors to the
          full-width wrap edge, not the side-inset pill row. The pill is full-
          width; the absolute medal floats over its right end (no flex/margin
          interplay — the old `data-detached` margin knob was never wired). */}
      <div
        className={s.barLine}
        data-expanded={expanded || undefined}
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
                  renderPlaceholder={
                    showExamples ? (
                      <RotatingPlaceholder examples={placeholderExamples!} active={!hasText} />
                    ) : undefined
                  }
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
      </div>
      {/* Detached medal — wrap-level sibling of `.barLine` (moved out 2026-06-25).
          Anchored absolute to `.wrap` so it floats at the screen edge, ignoring
          the wrap's side inset that the pill row takes. Collapses on focus (reads
          `[data-expanded]` off `.wrap`). */}
      {rightSlot}
    </div>
  );
};

export default WriteBarShell;

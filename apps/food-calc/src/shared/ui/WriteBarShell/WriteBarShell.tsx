import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { InfoButton } from '@/shared/ui/atoms/Button';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { RotatingPlaceholder } from './RotatingPlaceholder';
import { WriteBarHint } from './WriteBarHint';
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
  /** Resting floor in rows (AutoGrowSearch `minRows`). Default 1; 2 = tall bar. */
  minRows?: number;
  readOnly?: boolean;
  online: boolean;
  /**
   * Decide whether the send button shows (`visible`) / is enabled (`enabled`).
   * Visibility is CONTENT-driven (canon 2026-07-02): the send coin appears only
   * when there is something to send and vanishes on an empty field — no persistent
   * disabled coin. Default: `{ visible: hasText, enabled: online && hasText }`.
   * Consumers override (Events: text OR an atom; Hypotheses: title present).
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
  /**
   * Affordance IN FLOW to the right of the pill, inside the bar row (sibling of
   * the pill, not floating). The pill shrinks to leave room; a fading vertical
   * divider separates them. Unlike `rightSlot` it does not collapse on focus.
   */
  trailingSlot?: ReactNode;
  /** Inline style on the wrap — used to override geometry vars (`--pill-h`, `--coin-size`). */
  style?: CSSProperties;
  /** Replaces the entire input field (e.g. Food ready-state CTA). Forces collapsed. */
  fieldOverride?: ReactNode;
  hint?: string;
  /**
   * Optional label rendered as its own centered line ABOVE `hint` (stacked
   * layout) — e.g. Food's «Например» над примером-строкой. Voiced by
   * `<QuietLabel>` (serif-italic accent). When omitted, `hint` uses the inline
   * layout (first word accented in place). Both rendered by `WriteBarHint`.
   */
  hintLabel?: string;
  /**
   * Dim the page behind the bar on focus (`expanded`) so the accent falls on the
   * bar + its hint. ON by default for ALL write bars (per request 2026-07-05).
   * This is the successor to the global Screen focus-scrim removed 2026-06-23 —
   * that one flashed on Events focus-jerk because it keyed off CSS `:has(:focus)`;
   * this is per-bar, driven by the shell's own `expanded` state (smooth fade).
   * Opt out with `focusOverlay={false}`.
   */
  focusOverlay?: boolean;
  /**
   * Force the dim-backdrop ON even when the bar itself isn't focused/expanded —
   * e.g. Food keeps it lit while the предложка panel is mounted below the bar
   * (`fieldOverride` collapses `expanded`, so focus alone can't hold the dim).
   * OR'd with the internal `expanded` state; needs `focusOverlay` (default true)
   * to render at all. Tapping the dim still blurs the input (harmless no-op here).
   */
  overlayVisible?: boolean;
  className?: string;
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
  minRows = 1,
  readOnly,
  online,
  computeSend,
  busy = false,
  sendAriaLabel,
  leftSlot,
  rightSlot,
  trailingSlot,
  style,
  fieldOverride,
  hint,
  hintLabel,
  focusOverlay = true,
  overlayVisible = false,
  className,
  blurOnSubmit = false,
  onFieldFocus,
}: WriteBarShellProps) => {
  const { pressed: barPressed, pressProps: barPressProps } = usePressFeedback();

  const [focused, setFocused] = useState(false);
  // Подсказка-пример больше НЕ раскрывается сама на фокусе (2026-07-05) — её
  // прячем за кнопкой ⓘ в правом верхнем углу дока (по запросу). Тоггл: клик по
  // ⓘ показывает текст (fade), повторный — прячет. Сбрасывается на схлопывании
  // бара (`expanded` false), чтобы следующий фокус начинался с закрытой подсказки.
  const [hintOpen, setHintOpen] = useState(false);

  const expanded = focused && !fieldOverride;
  const hasText = value.trim().length > 0;

  // Схлопнулся бар → закрываем подсказку, чтобы ⓘ и текст ушли вместе с доком.
  useEffect(() => {
    if (!expanded) setHintOpen(false);
  }, [expanded]);

  // Карусель примеров: монтируется, когда переданы примеры И caller-гейт
  // `examplesActive` (список айтемов пуст). Сам цикл крутится только пока инпут
  // пуст (`active={!hasText}`); как только появляется текст — оверлей всё равно
  // прячется CSS-ом `:placeholder-shown`, а цикл замирает.
  const showExamples = !fieldOverride && !!placeholderExamples?.length && examplesActive;

  const send: SendState = computeSend
    ? computeSend({ focused: expanded, hasText, online })
    : { visible: hasText, enabled: online && hasText };

  const showSpinner = busy;
  // Видимость send-монеты — ОДИН источник правды: `send.visible` из computeSend
  // (content-driven, канон 2026-07-02). Монета появляется, когда есть что отправить,
  // и исчезает при пустом поле — без «постоянной» серой disabled-монеты. Прежняя
  // булева каша (`!autoHideSend || expanded || hasText`) + проп `autoHideSend` сняты.
  const showSend = !busy && !fieldOverride && send.visible;

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
  }, [send.enabled, onSubmit, value, blurOnSubmit, inputId]);

  return (
    <div
      className={clsx(s.wrap, className)}
      style={style}
      // `data-expanded` rides the wrap so the detached medal — now a wrap-level
      // sibling of `.barLine` (moved out 2026-06-25 so it floats at the screen
      // edge while the pill takes the wrap's side inset) — still reads collapse.
      data-expanded={expanded || undefined}
      // Marker for the Screen focus-scrim (`:has([data-write-bar] textarea:focus)`).
      data-write-bar=""
    >
      {/* Opt-in dim-backdrop: fixed inset:0 but INSIDE `.wrap` at z-index:-1, so the
          dock plate + pill + hint paint OVER it (bright) while the page below dims.
          Tap the dimmed area → blur the input (dismiss). Fades with `expanded`. */}
      {focusOverlay ? (
        <div
          className={s.focusOverlay}
          data-visible={expanded || overlayVisible || undefined}
          aria-hidden="true"
          onPointerDown={() => document.getElementById(inputId)?.blur()}
        />
      ) : null}
      {(hint || hintLabel) && expanded ? (
        // Док подсказки: грид «колонка · центр · колонка». Текст (WriteBarHint)
        // в центральной колонке строго по ЦЕНТРУ (равные боковые 1fr), кнопка ⓘ —
        // в правой колонке. Всё в потоке. Монтируется ТОЛЬКО на фокусе (expanded),
        // иначе в покое кнопка-колонка резервировала бы высоту над пилюлей.
        <div className={s.hintDock}>
          <WriteBarHint body={hint ?? ''} label={hintLabel} visible={hintOpen} />
          {/* preventDefault на pointerdown ОБЁРТКИ (не самой кнопки — там
              onPointerDown занят usePressFeedback внутри IconButton) держит фокус
              на textarea: без него тап по ⓘ сбросил бы фокус → onBlur → бар
              схлопнулся бы, не успев показать текст. */}
          <div className={s.hintBtn} onPointerDown={(e) => e.preventDefault()}>
            <InfoButton
              tone="ghost"
              size={32}
              glyphSize={20}
              aria-label={hintOpen ? 'Скрыть подсказку' : 'Показать подсказку'}
              aria-expanded={hintOpen}
              tabIndex={expanded ? 0 : -1}
              onClick={() => setHintOpen((open) => !open)}
            />
          </div>
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
          data-has-left={leftSlot && !expanded ? '' : undefined}
          // fieldOverride = ряд больше НЕ поле ввода (напр. ready-заголовок Еды) →
          // снимаем well-заливку/тень/хайрлайн: утопленный слот под заголовком
          // читался бы как текст в поиске. See `.writeBarRow[data-field-override]`.
          data-field-override={fieldOverride ? '' : undefined}
        >
          {/* На фокусе боковые слоты НЕ рендерятся (2026-06-27) — поле забирает всю
              ширину пилюли. Send-монета остаётся (она не боковой слот). */}
          {!expanded && leftSlot}
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
                  maxRows={focused ? maxRowsFocused : minRows}
                  minRows={minRows}
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
        {/* trailingSlot — in-flow sibling of the pill (food «Список»), divider via
            `.trailingSlot::before`. Pill (`.writeBarRow`) is flex:1 → shrinks for it. */}
        {trailingSlot && !expanded ? <div className={s.trailingSlot}>{trailingSlot}</div> : null}
      </div>
      {/* Detached medal — wrap-level sibling of `.barLine` (moved out 2026-06-25).
          Anchored absolute to `.wrap` so it floats at the screen edge. На фокусе
          не рендерится (2026-06-27) — поле на всю ширину. */}
      {!expanded && rightSlot}
    </div>
  );
};

export default WriteBarShell;

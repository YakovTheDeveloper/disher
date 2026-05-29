import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import type { UseWriteFoodFlowResult } from '../../model/useWriteFoodFlow';
import s from './WriteFoodInput.module.scss';

// WriteBar design-variants (scaffold 2026-05-24). Default = `current` —
// текущий thin-pill canon. Альтернативы:
// - warm-soft / graphite — CSS-only переодевания (pill+tile рядом).
// - messenger-blue / messenger-warm — структурный сдвиг: лупа становится
//   leading-affordance ВНУТРИ pill, send — полноразмерный круг trailing,
//   внешний tile скрыт. Inspired by Telegram/Messenger reference.
// Юзер свайпает через DesignVariantsBar, выбирает финал, неподходящие
// чистим вместе с этим anchor'ом.
const WRITE_BAR_VARIANTS = [
  'current',
  'warm-soft',
  'graphite',
  'messenger-blue',
  'messenger-warm',
] as const;

const SearchIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10.3" cy="10.3" r="9.6" stroke="currentColor" strokeWidth="1.1" />
    <path d="M21.5 21.5 L17.1 17.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    <path
      d="M7 10.8 L10 13.5 L14 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const SendArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path
      d="M3.5 9h11M10 4.5L14.5 9 10 13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Paper-plane (Telegram-style) — slightly tilted self, fill currentColor.
// Используется в `messenger-*` вариантах вместо плоской стрелки.
const PaperPlaneIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M2.3 9.3 L17.2 2.6 C17.8 2.3 18.4 2.9 18.1 3.5 L11.4 18.4 C11.1 19.1 10.1 19.0 9.9 18.3 L8.0 12.5 C7.9 12.2 7.7 12.0 7.4 11.9 L1.6 10.0 C0.9 9.8 0.8 8.8 1.5 8.5 Z"
      fill="currentColor"
    />
  </svg>
);

// Catalog-icon (filled, 2026-05-24): рука держит cloche (room-service dome)
// с тарелкой. ViewBox 24×24, в DOM 20×20. fill=currentColor — наследует
// graphite-тон из `.writeBarList`.
const CatalogIconDome = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="6.4" r="0.9" />
    <path d="M 5 14 A 7 7 0 0 1 19 14 Z" />
    <ellipse cx="12" cy="14.3" rx="7.8" ry="0.7" />
    <path d="M 2 17.5 Q 4 16 7 16 L 17 16 Q 20 16 22 17.5 Q 22.6 19 21.4 19.6 L 20.4 19.6 Q 19.6 19.6 19.4 20.4 L 19.2 21 Q 19 21.8 18.2 21.8 L 5.8 21.8 Q 5 21.8 4.8 21 L 4.6 20.4 Q 4.4 19.6 3.6 19.6 L 2.6 19.6 Q 1.4 19 2 17.5 Z" />
  </svg>
);

const DEFAULT_PLACEHOLDER = 'Опишите, что ели…';
const ANCHOR_SELECTOR = '[data-write-food-anchor]';

// iOS Safari: нативный scroll-on-focus для инпута в нижнем доке иногда не
// срабатывает — клавиатура закрывает поле. setTimeout 300ms (folk-pattern)
// не годится: магическое число, ловит не тот момент. Слушаем реальный сигнал
// — `visualViewport.resize`, который фаерится когда WebKit поднял клавиатуру.
//
// Контракт:
//  - vv недоступен (старый браузер / SSR) → скроллим сразу, без задержки;
//  - vv уже сжат (быстрый переход с другого инпута — клавиатура уже открыта)
//    → скроллим сразу, resize не прилетит;
//  - иначе ждём resize ИЛИ fallback-таймер 500ms (десктоп с hw-клавиатурой,
//    iOS 26 баг с offsetTop, прочая экзотика).
const KEYBOARD_OPEN_RATIO = 0.85;
const KEYBOARD_FALLBACK_MS = 500;

function scrollInputAboveKeyboard(target: HTMLElement) {
  const doScroll = () => {
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
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

export interface WriteFoodInputProps {
  /** free-text-food flow (см. `useWriteFoodFlow`). */
  flow: UseWriteFoodFlowResult;
  /** id для `<input>`/`<textarea>` — должен совпадать с `htmlFor` у внешних триггеров. */
  inputId: string;
  placeholder?: string;
  /** htmlFor для search-affordance (лупа). */
  searchHtmlFor: string;
  searchLabel?: string;
  /** Подпись под лупой (например, "Каталог"). */
  searchText?: string;
  className?: string;
}

/**
 * Messenger-style write-field: AutoGrowSearch + send + tile «Каталог» справа.
 *
 * Извлечён из `AppBottomBar.writeFoodInputLike` (2026-05-23) чтобы переиспользовать
 * на DishBuilderPage. Caller обязан НЕ монтировать `<WriteFoodModals>` overlay —
 * иначе в DOM появится дубликат `id={inputId}`.
 *
 * Auto-scroll/shake к предложке (`[data-write-food-anchor]`) — встроены: после
 * submit'а смуз-скроллит, в ready-state клик «Посмотреть варианты» докручивает
 * мгновенно + триггерит CSS-shake.
 */
export const WriteFoodInput = ({
  flow,
  inputId,
  placeholder = DEFAULT_PLACEHOLDER,
  searchHtmlFor,
  searchLabel,
  searchText,
  className,
}: WriteFoodInputProps) => {
  const online = useOnline();
  const { variant, anchor: variantAnchor } = useDesignVariant(
    'WriteBar',
    WRITE_BAR_VARIANTS,
  );
  const isMessenger = variant === 'messenger-blue' || variant === 'messenger-warm';

  // Idle/blur — 1 ряд, фокус — до 4 рядов. Auto-grow от value уже встроен в
  // AutoGrowSearch (он сам пересчитывает через recomputeRows на изменение
  // `[value, recomputeRows]`).
  const [focused, setFocused] = useState(false);

  const isReady = flow.state === 'ready';
  const isLoading = flow.state === 'loading';
  const canSubmit =
    online && !isLoading && flow.inputText.trim().length > 0;

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      flow.submit(trimmed);
      // Привязка к user-action: rAF ждёт пока React закоммитит skeleton-рендер
      // и узел появится в DOM. `behavior: 'smooth'` уважает prefers-reduced-motion.
      requestAnimationFrame(() => {
        document
          .querySelector(ANCHOR_SELECTOR)
          ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    },
    [flow],
  );

  // Ready-state: instant-scroll до предложки + короткий shake чтобы взгляд
  // прибился к ней. Toggle через data-shake: remove → force-reflow → set,
  // чтобы анимация перезапускалась на каждый клик.
  const handleViewResults = useCallback(() => {
    const target = document.querySelector(ANCHOR_SELECTOR) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    target.removeAttribute('data-shake');
    void target.offsetWidth;
    target.setAttribute('data-shake', '');
  }, []);

  return (
    <div
      className={clsx(s.wrap, className)}
      data-write-state={isReady ? 'ready' : 'idle'}
      {...variantAnchor}
    >
      <div className={s.writeBarRow}>
        {isReady ? (
          <button
            type="button"
            className={s.writeFieldReady}
            onClick={handleViewResults}
          >
            Посмотреть варианты
          </button>
        ) : (
          <div
            className={clsx(s.writeField, s.writeBarInput)}
            data-state={flow.state}
          >
            <div className={s.writeFieldRow}>
              {/* Leading search-affordance — ВСЕГДА монтируется (чтобы DOM был
                  стабилен между вариантами), default скрыт через CSS,
                  показывается только в [data-dv-v='messenger-*']. */}
              <label
                htmlFor={searchHtmlFor}
                className={s.leadingSearch}
                aria-label={searchLabel ?? 'Найти'}
              >
                <SearchIcon size={20} />
              </label>
              <AutoGrowSearch
                id={inputId}
                value={flow.inputText}
                onChange={flow.setInputText}
                onSubmit={handleSubmit}
                onFocus={(e) => {
                  setFocused(true);
                  scrollInputAboveKeyboard(e.currentTarget);
                }}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                maxRows={focused ? 4 : 1}
                collapseOnBlur={false}
                className={s.writeFieldInput}
                readOnly={isLoading}
              />
              {isLoading ? (
                <div
                  className={s.writeFieldStatus}
                  role="status"
                  aria-label="Распознаём"
                >
                  <Spinner size={16} />
                </div>
              ) : (
                <button
                  type="button"
                  className={s.writeFieldSend}
                  onClick={() => handleSubmit(flow.inputText)}
                  disabled={!canSubmit}
                  aria-label={online ? 'Отправить' : 'Нет сети'}
                >
                  {isMessenger ? <PaperPlaneIcon /> : <SendArrowIcon />}
                </button>
              )}
            </div>
          </div>
        )}
        <label
          htmlFor={searchHtmlFor}
          className={s.writeBarList}
          aria-label={searchLabel ?? 'Найти'}
        >
          <CatalogIconDome size={20} />
          {searchText && (
            <span className={s.writeBarListText}>{searchText}</span>
          )}
        </label>
      </div>
    </div>
  );
};

export default WriteFoodInput;

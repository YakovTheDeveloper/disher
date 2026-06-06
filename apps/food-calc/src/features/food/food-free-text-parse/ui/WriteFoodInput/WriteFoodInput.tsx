import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import type { UseWriteFoodFlowResult } from '../../model/useWriteFoodFlow';
import s from './WriteFoodInput.module.scss';

// Цветовое оформление бара (пилюля + плитка «Выбор еды» + send-стрелка).
// Набор сведён юзером к двум (2026-06-05): `ash` (светлый нейтральный серый,
// строгий — дефолт) и `mint` (мятно-небесный градиент, = бывш. warm mint-sky).
// Высота зафиксирована (xl ≈ 72px). Каждый вариант — набор `--wb-*` / `--field-*`
// на `.wrap` (см. .module.scss). Перелистывается DesignVariantsBar.
const WRITEBAR_VARIANTS = ['ash', 'mint'] as const;

// Форма/рамка плитки «Выбор еды» — «почтовая марка» + вайб NavTile (тех же
// «квадратиков смены контента» сверху). Anchor `FoodTile` навешен на саму
// плитку (`.writeBarList`); варианты меняют ТОЛЬКО силуэт/рамку/декор, цвет
// берётся из WriteBar-палитры (`--wb-tile-*`) → композируется с ash/mint.
// perf (дефолт) = круглая перфорация по периметру (самый прямой «марка» read).
const FOODTILE_VARIANTS = ['perf', 'paper', 'dashed', 'engraving', 'scallop'] as const;

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

// Фоновая картинка плитки «Выбор еды» — гравюра-клош (cloche / room-service
// dome) на белом фоне, в стиле NavTile-арта. Лежит призраком ПОД подписью
// (см. `.writeBarListImg`), белый фон сливается с плиткой на малой opacity.
const FOOD_TILE_IMG = '/art/plate.png';

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
 * мгновенно + триггерит CSS-shake. Скролл над клавиатурой при фокусе — мгновенный.
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
  const { pressed: searchPressed, pressProps: searchPressProps } = usePressFeedback();
  const { anchor: writeBarAnchor } = useDesignVariant('WriteBar', WRITEBAR_VARIANTS);
  const { anchor: foodTileAnchor } = useDesignVariant('FoodTile', FOODTILE_VARIANTS);

  // Idle/blur — 1 ряд, фокус — до 4 рядов. Auto-grow от value уже встроен в
  // AutoGrowSearch (он сам пересчитывает через recomputeRows на изменение
  // `[value, recomputeRows]`).
  const [focused, setFocused] = useState(false);

  const isReady = flow.state === 'ready';
  const isLoading = flow.state === 'loading';
  const hasText = flow.inputText.trim().length > 0;
  const canSubmit = online && !isLoading && hasText;

  // Развёрнутая раскладка (пилюля на всю ширину, плитка «Еда» уезжает) — строго
  // на фокусе (выбор юзера 2026-06-04: blur сворачивает обратно, даже если текст
  // остался). `!isReady` — в ready-state pill заменён на CTA, фокуса нет.
  const expanded = focused && !isReady;
  // Стрелку показываем только когда поле в фокусе И есть текст — «прятать до
  // текста». В свёрнутом состоянии стрелки нет вовсе (канон 2026-06-04).
  const showSend = !isLoading && expanded && hasText;

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
      {...writeBarAnchor}
      className={clsx(s.wrap, className)}
      data-write-state={isReady ? 'ready' : 'idle'}
    >
      <div className={s.writeBarRow} data-expanded={expanded || undefined}>
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
              ) : showSend ? (
                <button
                  type="button"
                  className={s.writeFieldSend}
                  // preventDefault на pointerdown держит фокус: иначе нажатие
                  // блюрит инпут → expanded=false → кнопка размонтируется до
                  // того как долетит click, и submit не происходит.
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => handleSubmit(flow.inputText)}
                  disabled={!canSubmit}
                  aria-label={online ? 'Отправить' : 'Нет сети'}
                >
                  <SendArrowIcon />
                </button>
              ) : null}
            </div>
          </div>
        )}
        <label
          htmlFor={searchHtmlFor}
          className={s.writeBarList}
          aria-label={searchLabel ?? 'Найти'}
          data-pressed={searchPressed || undefined}
          {...searchPressProps}
          {...foodTileAnchor}
        >
          <img src={FOOD_TILE_IMG} className={s.writeBarListImg} alt="" aria-hidden />
          {searchText && (
            <span className={s.writeBarListText}>{searchText}</span>
          )}
        </label>
      </div>
    </div>
  );
};

export default WriteFoodInput;

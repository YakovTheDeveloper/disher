import { useCallback, useId, useState, type ReactNode } from 'react';
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

// Текст дуговых подписей медальона-печати: верхняя дуга + нижняя (как на монете).
// Хардкод — одинаков для всех консьюмеров; searchText идёт только в aria-label.
const ARC_TOP = 'выбрать из';
const ARC_BOTTOM = 'списка еды';

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

// Богатый плейсхолдер: первое слово — serif-italic акцент (канон --heading-font),
// остальное — обычный шрифт поля. Нативный `placeholder` остаётся строкой (для
// скринридеров + детекта пустоты через :placeholder-shown), AutoGrowSearch
// рисует этот узел поверх него (см. `renderPlaceholder`). Split по первому
// пробелу: «Опишите,» → акцент, « что ели…» → обычным (ведущий пробел сохранён).
function renderAccentPlaceholder(text: string): ReactNode {
  const spaceIdx = text.indexOf(' ');
  if (spaceIdx === -1) return text;
  return (
    <>
      <em className={s.placeholderAccent}>{text.slice(0, spaceIdx)}</em>
      {text.slice(spaceIdx)}
    </>
  );
}

// Focus-hint (`hint` prop): пример ввода, всплывающий НАД баром при фокусе,
// поверх Screen focus-scrim'а. Первое слово («Например,») — serif-italic акцент
// (тот же канон, что у плейсхолдера), остальное — сам пример. Тот же split по
// первому пробелу, что и в renderAccentPlaceholder.
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
  /**
   * Опциональная подсказка-пример. Всплывает НАД баром в фокусе (поверх
   * focus-scrim'а), плавает в затемнённой области над пилюлей. Не задана —
   * подсказки нет. Напр.: «Например, 9:40 гречка 80, масло 10, яйцо 80».
   */
  hint?: string;
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
  hint,
  className,
}: WriteFoodInputProps) => {
  const online = useOnline();
  const { pressed: searchPressed, pressProps: searchPressProps } = usePressFeedback();
  // Press-отклик самой пилюли (как у плитки «Еда», но мягче): pointerdown по полю
  // ввода мгновенно красит подложку в светло-серый. Хук тот же — :active на
  // не-button не работает на iOS. Тащим `data-pressed` на ряд-пилюлю, а слушатели
  // вешаем на поле ввода (`.writeField`), чтобы тап по плитке/CTA пилюлю НЕ красил.
  const { pressed: barPressed, pressProps: barPressProps } = usePressFeedback();
  const { anchor: writeBarAnchor } = useDesignVariant('WriteBar', WRITEBAR_VARIANTS);
  // Уникальные id для SVG-путей дуг (textPath ссылается по #id). Колоны из useId
  // выпиливаем — чище для URL-фрагмента.
  const arcBase = useId().replace(/:/g, '');
  const arcTopId = `${arcBase}-t`;
  const arcBotId = `${arcBase}-b`;

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
      // Маркер для focus-scrim'а: `Screen` ловит `:has([data-write-bar]
      // textarea:focus)` и затемняет весь экран на время фокуса (см. Screen.module.scss).
      data-write-bar=""
    >
      {hint ? (
        // Парит НАД пилюлей в затемнённой области (Screen focus-scrim) — абсолют
        // от `.wrap`, поэтому скролл-над-клавиатурой держит подсказку над
        // клавиатурой вместе с баром. aria-hidden: дублирует смысл плейсхолдера.
        <div className={s.focusHint} data-visible={expanded || undefined} aria-hidden="true">
          {renderHint(hint)}
        </div>
      ) : null}
      <div
        className={s.writeBarRow}
        data-expanded={expanded || undefined}
        data-pressed={barPressed || undefined}
      >
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
            {...barPressProps}
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
                renderPlaceholder={renderAccentPlaceholder(placeholder)}
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
          aria-label={searchLabel ?? searchText ?? 'Найти'}
          data-pressed={searchPressed || undefined}
          {...searchPressProps}
        >
          {/* Медальон-печать: клош-эмблема по центру + две дуговые подписи
              (верх/низ, SVG textPath), как на монете. Рим-текст = явная кнопка. */}
          <img src={FOOD_TILE_IMG} className={s.writeBarListImg} alt="" aria-hidden />
          <svg className={s.writeBarListArc} viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              {/* верхний полукруг (sweep 1) + нижний (sweep 0) — текст обоих
                  читается слева-направо, прямо */}
              <path id={arcTopId} d="M 14,50 A 36,36 0 0 1 86,50" fill="none" />
              <path id={arcBotId} d="M 3,50 A 47,47 0 0 0 97,50" fill="none" />
            </defs>
            <text>
              <textPath href={`#${arcTopId}`} startOffset="50%" textAnchor="middle">
                {ARC_TOP}
              </textPath>
            </text>
            <text>
              <textPath href={`#${arcBotId}`} startOffset="50%" textAnchor="middle">
                {ARC_BOTTOM}
              </textPath>
            </text>
          </svg>
        </label>
      </div>
    </div>
  );
};

export default WriteFoodInput;

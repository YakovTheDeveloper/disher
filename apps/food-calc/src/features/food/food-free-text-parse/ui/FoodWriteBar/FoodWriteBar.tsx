import { useCallback } from 'react';
import clsx from 'clsx';
import { WriteBarShell, WriteBarMedal } from '@/shared/ui/WriteBarShell';
import { Button } from '@/shared/ui/atoms/Button';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import type { UseWriteFoodFlowResult } from '../../model/useWriteFoodFlow';
import s from './FoodWriteBar.module.scss';

// Дуговые подписи медальона-печати «Список еды / вручную» (верх/низ, как на монете).
const ARC_TOP = 'Список еды';
const ARC_BOTTOM = 'вручную';
// Фоновая гравюра плитки — клош (cloche / room-service dome).
const FOOD_TILE_IMG = '/art/plate.png';
// aria-label медали (видимый текст дуг одинаков; сведён к одному 2026-06-25).
const SEARCH_LABEL = 'Найти еду';
const PLACEHOLDER = 'Напишите, что вы ели';
const ANCHOR_SELECTOR = '[data-write-food-anchor]';

// DesignBar-анкор «FoodListCta»: как выглядит правый affordance «добавить еду».
// `medal` — текущий канон (монета-печать). Остальные — эксперимент: обычная
// Button «Список» с ведущей иконкой «вилка+нож», в разных цветовых обликах. Все
// варианты остаются `<label htmlFor>` → делегируют фокус в каталог-инпут (тот же
// механизм, что у медали). Цвет каждого облика задан в .module.scss по `data-dv-v`
// (заливка + парный контрастный текст: тёмная заливка → светлый текст и наоборот).
const LIST_CTA_LABEL = 'Список';
const LIST_CTA_VARIANTS = [
  'medal', // канон — монета-печать
  // ── наша палитра (sys-токены) ──
  'coal', // тёмный уголь · белый текст
  'floating', // near-black floating ink · белый текст
  'indigo', // accent indigo · белый текст
  'indigo-soft', // soft indigo · indigo текст
  'amber', // бренд-медовый · тёмный ink-текст
  'amber-soft', // soft медовый · deep-amber текст
  // ── родная жёлтая палитра ──
  'lemon', // яркий лимон · тёмный текст
  'gold', // золотой мёд · тёмный текст
  // ── ещё один ──
  'lime', // свежий зелёный · тёмный текст
] as const;

// Вилка+нож (Lucide «utensils») — ведущая иконка кнопки «Список». Залита
// currentColor → наследует цвет текста кнопки, поэтому контраст к заливке (белый
// на тёмной / тёмный на светлой) решается автоматически. Размер берёт из
// `.system .icon svg` в Button (20px).
const ForkKnifeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

// Примеры-подсказки для пустого бара (карусель в WriteBarShell): крутятся, пока
// в инпуте пусто И список ещё пуст — онбординг свежего экрана. Вшиты в компонент:
// оба экрана (Рацион + DishBuilder) делят один набор примеров (конвергенция).
const PLACEHOLDER_EXAMPLES = [
  'Овсянка на молоке, банан',
  'Куриная грудка с рисом',
  'Греческий йогурт и мёд',
  'Кофе с молоком, тост',
  'Творог 200 г, горсть орехов',
];

// Подсказка-пример над баром в фокусе. Переносы — через `\n` (CSS white-space:
// pre-line); без них длинные строки авто-переносит по ширине 80%.
const HINT =
  'Например, 9:40 гречка 80, сливочное масло 10,\nяйцо 80, вода 200, хлеб 100, сыр 30';

export interface FoodWriteBarProps {
  /** free-text-food flow (см. `useWriteFoodFlow`). */
  flow: UseWriteFoodFlowResult;
  /** id для `<input>`/`<textarea>` — должен совпадать с `htmlFor` у внешних триггеров. */
  inputId: string;
  /** htmlFor медали → SEARCH_INPUT create-флоу таргета (открывает каталог). */
  searchHtmlFor: string;
  /** Гейт «список айтемов пуст» — карусель примеров показывается только тогда. */
  examplesActive?: boolean;
}

/**
 * Нижний док добавления еды для двух экранов (Рацион `FoodSchedule` + блюдо
 * `DishBuilderPage`): free-text write-бар над общим `WriteBarShell` + медаль-
 * печать «Список еды / вручную» (`WriteBarMedal`), открывающая каталог. Поглотил
 * бывший `WriteFoodInput` (нет второго потребителя → слой-индирекция убран,
 * 2026-06-25) и редундантную пару `AppBottomBar`(write) + `raisedFoodDock`.
 *
 * Весь облик и тексты вшиты (максимальная конвергенция экранов); наружу торчат
 * только функциональные пропы. Медаль едет на штатном шве `rightSlot` (как `clip`
 * на `leftSlot` у Событий/Гипотез) — её float/collapse владеют `WriteBarShell`/
 * `WriteBarMedal`, тут только конфиг + подъём дока (`.dock` padding-bottom).
 * Caller обязан НЕ монтировать `<WriteFoodModals>` overlay — иначе дубль `inputId`.
 */
export const FoodWriteBar = ({
  flow,
  inputId,
  searchHtmlFor,
  examplesActive,
}: FoodWriteBarProps) => {
  const online = useOnline();
  const isReady = flow.state === 'ready';
  const isLoading = flow.state === 'loading';

  // Эксперимент-облик правого affordance (см. LIST_CTA_VARIANTS).
  const { variant: listCta, anchor: listCtaAnchor } = useDesignVariant(
    'FoodListCta',
    LIST_CTA_VARIANTS,
  );
  const ctaIsButton = listCta !== 'medal';

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      flow.submit(trimmed);
    },
    [flow]
  );

  // Ready-state: instant-scroll до предложки + короткий shake.
  const handleViewResults = useCallback(() => {
    const target = document.querySelector(ANCHOR_SELECTOR) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    target.removeAttribute('data-shake');
    void target.offsetWidth;
    target.setAttribute('data-shake', '');
  }, []);

  return (
    <div className={s.dock}>
      <WriteBarShell
        value={flow.inputText}
        onChange={flow.setInputText}
        onSubmit={handleSubmit}
        inputId={inputId}
        placeholder={PLACEHOLDER}
        placeholderExamples={PLACEHOLDER_EXAMPLES}
        examplesActive={examplesActive}
        online={online}
        busy={isLoading}
        readOnly={isLoading}
        hint={HINT}
        writeState={isReady ? 'ready' : 'idle'}
        scrollToOnSubmit={ANCHOR_SELECTOR}
        fieldOverride={
          isReady ? (
            // Канон-вариант `link` (скроллит к предложке). `.readyCta` оставляет
            // только раскладку: flex-fill + крупный размер через --btn-font-size.
            <Button variant="link" className={s.readyCta} onClick={handleViewResults}>
              Посмотреть варианты
            </Button>
          ) : undefined
        }
        rightSlot={
          // Обёртка несёт DesignBar-анкор (data-dv*/ref) и — для button-вариантов
          // — плавающее позиционирование у правого края (медаль позиционирует себя
          // сама, обёртка для неё прозрачна — static, 0-высоты вне потока).
          <div className={s.listCtaSlot} {...listCtaAnchor}>
            {ctaIsButton ? (
              <Button
                as="label"
                htmlFor={searchHtmlFor}
                aria-label={SEARCH_LABEL}
                variant="system"
                icon={<ForkKnifeIcon />}
                className={clsx(s.listCtaButton, isReady && s.listCtaDim)}
              >
                {LIST_CTA_LABEL}
              </Button>
            ) : (
              <WriteBarMedal
                htmlFor={searchHtmlFor}
                ariaLabel={SEARCH_LABEL}
                img={FOOD_TILE_IMG}
                arcTop={ARC_TOP}
                arcBottom={ARC_BOTTOM}
                lifted
                dimmed={isReady}
              />
            )}
          </div>
        }
      />
    </div>
  );
};

export default FoodWriteBar;

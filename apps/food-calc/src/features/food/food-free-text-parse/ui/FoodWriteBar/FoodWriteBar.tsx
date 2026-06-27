import { useCallback, type CSSProperties } from 'react';
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
// Двухстрочный плейсхолдер — занимает обе строки высокого бара (textarea-
// плейсхолдер чтит `\n`). Список-кнопка справа держит оффлайн-путь; инпут —
// онлайн free-text. На populated-экране виден этот статичный текст (карусель
// примеров крутится только на пустом онбординг-экране, см. PLACEHOLDER_EXAMPLES).
const PLACEHOLDER = 'Опишите прием пищи, типа: овсянка 100, банан 1 шт';
const ANCHOR_SELECTOR = '[data-write-food-anchor]';

// DesignBar-анкор «FoodListCta»: ФОРМА входа «список еды» в высоком (2-строчном)
// баре. Оба варианта = «еда» справа за фейдинг-дивайдером, в потоке (не перекрывает
// список); отличие только в облике affordance. «Список» — не вторичная кнопка:
// free-text-инпут требует интернет (LLM), а приложение offline-first → каталог
// (в бандле) и есть единственный рабочий путь добавить еду оффлайн. Поэтому
// оффлайн-эмфаза (`data-net='on'|'off'`): тихо онлайн → заметнее оффлайн.
//
//   tall-split — круг-иконка (вилка-нож), оффлайн-адаптивная амбра
//   tall-medal — монета-печать «Список еды / вручную» (тот же канон-медальон)
const LIST_CTA_VARIANTS = ['tall-split', 'tall-medal'] as const;

// DesignBar-анкор «FoodListTint»: ПОДЛОЖКА круг-кнопки tall-split — отдельная ось
// для подбора цвета фона глазами (предложка-стиль). Первый = дефолт (медовый soft,
// как было). Оффлайн-эмфаза перебивает любой тинт сплошной амброй (см. .module.scss).
//   amber-soft · amber · paper (тёплый лист) · ink (тёмная) · accent (индиго)
const LIST_CTA_TINTS = ['amber-soft', 'amber', 'paper', 'ink', 'accent'] as const;

// Высокий бар: 2 строки + крупная send-монета + концентричный радиус пилюли
// (рифмуется с углом док-плашки, см. --sys-radius-overlay-inner). Подаётся инлайн-
// override geometry-vars на .wrap — минимальный API, без правки базовых классов.
const TALL_STYLE = {
  '--pill-h': '68px',
  '--coin-size': '64px',
  '--wb-pill-radius': 'var(--sys-radius-overlay-inner)',
} as CSSProperties;

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
const HINT = 'Например, 9:40 гречка 80, сливочное масло 10,\nяйцо 80, вода 200, хлеб 100, сыр 30';

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
 * только функциональные пропы. Вход «список еды» едет в `trailingSlot` высокого
 * бара (в потоке, за фейдинг-дивайдером, не перекрывает список) — облик выбирает
 * DesignBar-анкор `FoodListCta` (tall-split круг-иконка / tall-medal монета).
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

  // Эксперимент-облик affordance «список еды» (см. LIST_CTA_VARIANTS).
  const { variant: listCta, anchor: listCtaAnchor } = useDesignVariant(
    'FoodListCta',
    LIST_CTA_VARIANTS
  );
  // tall-medal = монета-печать в trailing; иначе (tall-split) круг-иконка.
  const isMedalTrail = listCta === 'tall-medal';
  // Подложка круг-кнопки (tall-split) — отдельная ось DesignBar (см. LIST_CTA_TINTS).
  const { anchor: listTintAnchor } = useDesignVariant('FoodListTint', LIST_CTA_TINTS);
  // Оффлайн-эмфаза: онлайн тихо, оффлайн — заметный единственный путь.
  const netAttr = online ? 'on' : 'off';

  // Кнопка-«Список» (tall-split) — icon-only круг вилка-нож. Облик/вес задаёт
  // обёртка `.listCtaTrail[data-dv-v='tall-split']` в .module.scss.
  const ctaButton = (
    <Button
      as="label"
      htmlFor={searchHtmlFor}
      aria-label={SEARCH_LABEL}
      variant="system"
      icon={<ForkKnifeIcon />}
      className={clsx(s.listCtaButton, isReady && s.listCtaDim)}
    />
  );

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
        minRows={2}
        style={TALL_STYLE}
        autoHideSend
        trailingSlot={
          // «еда» справа от пилюли, в потоке, за фейдинг-дивайдером (не плавает,
          // не перекрывает список). Обёртка несёт DesignBar-анкор + оффлайн-эмфазу.
          <div className={s.listCtaTrail} data-net={netAttr} {...listCtaAnchor}>
            {isMedalTrail ? (
              // tall-medal: монета-печать в потоке (floating={false} → не уезжает
              // в плавающий режим, не сворачивается на фокусе).
              <WriteBarMedal
                htmlFor={searchHtmlFor}
                ariaLabel={SEARCH_LABEL}
                img={FOOD_TILE_IMG}
                arcTop={ARC_TOP}
                arcBottom={ARC_BOTTOM}
                floating={false}
                dimmed={isReady}
              />
            ) : (
              // tall-split: tint-обёртка несёт ось `FoodListTint` (подбор подложки).
              <span className={s.listCtaTint} {...listTintAnchor}>
                {ctaButton}
              </span>
            )}
          </div>
        }
        fieldOverride={
          isReady ? (
            // Канон-вариант `link` (скроллит к предложке). `.readyCta` оставляет
            // только раскладку: flex-fill + крупный размер через --btn-font-size.
            <Button variant="link" className={s.readyCta} onClick={handleViewResults}>
              Посмотреть варианты
            </Button>
          ) : undefined
        }
      />
    </div>
  );
};

export default FoodWriteBar;

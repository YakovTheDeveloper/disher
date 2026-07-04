import { useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { WriteBarShell, WriteBarMedal } from '@/shared/ui/WriteBarShell';
import type { SendState } from '@/shared/ui/WriteBarShell';
import { Button } from '@/shared/ui/atoms/Button';
import { Heading } from '@/shared/ui/atoms/Typography';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import toaster from '@/shared/lib/toaster/toaster';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { FeatureErrorBoundary } from '@/shared/ui/error/FeatureErrorBoundary';
import type { UseWriteFoodFlowResult } from '../../model/useWriteFoodFlow';
import { InlineWriteFoodReview } from '../InlineWriteFoodReview';
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
const PLACEHOLDER = 'Напишите, что Вы ели';
// Плейсхолдер на время разбора: панель предложки во время `loading` НЕ
// монтируется (спиннер в баре — единственный фидбэк), поэтому статус
// «идёт разбор» несёт сам бар — пустое поле + этот плейсхолдер + спиннер-монета.
const LOADING_PLACEHOLDER = 'Распознаём…';

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

// Подсказка-пример над баром в фокусе. Метка «Например» едет отдельной строкой
// по центру сверху (hintLabel), пример-тело — строкой ниже (hint). Переносы тела
// — через `\n` (CSS white-space: pre-line); без них длинные строки авто-переносит.
const HINT_LABEL = 'Например';
const HINT = '9:40 гречка 80, сливочное масло 10,\nяйцо 80, вода 200, хлеб 100, сыр 30';

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
 *
 * Док = бар + панель предложки (`InlineWriteFoodReview`), по паттерну Событий
 * (`EventsWriteBar` + `EventScalePanel`, 2026-07-02): пока разбор идёт/готов
 * (`loading`/`ready`), панель монтируется НИЖЕ бара (как EventScalePanel) —
 * контент выступает естественным продолжением вниз, в место клавиатуры, накрывая
 * список (bottomBar Screen = absolute-overlay). Свой внутренний скролл (max-height
 * 65dvh). Клавиатура/лок-свайпа/back берутся из Событий: `useKeyboardStick`
 * (transform-mode лифтит весь док над клавиатурой при инлайн-правке кол-ва/времени),
 * `useSwipeableLock` (блок дневного пейджера пока панель открыта), `useOverlayHistory`
 * (браузерный Back закрывает предложку через `flow.cancel`).
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
  // Панель открыта ТОЛЬКО когда разбор готов (`ready`). Во время `loading`
  // (2026-07-02) панель больше НЕ монтируется — фидбэк разбора несёт сам бар
  // (спиннер-монета + плейсхолдер «Распознаём…»), без большого скелетона и
  // последующего layout-swap'а. Флаг питает монтирование панели и всю связку
  // клавиатура/лок/back (как `atomsOpen` у Событий).
  const panelOpen = isReady;

  // Док = бар + панель. keyboard-stick лифтит весь док (transform-mode — bottomBar
  // Screen absolute внутри трансформированного Embla-слайда, `fixed` резолвился бы
  // против слайда). Включён только пока панель открыта — точная калька Событий.
  const dockRef = useKeyboardStick<HTMLDivElement>({ mode: 'transform', enabled: panelOpen });
  // Пока панель открыта: лочим дневной пейджер и заворачиваем Back на закрытие
  // предложки (cancel() = единственный dismiss, он же у кнопки «Отменить»).
  useSwipeableLock(panelOpen);
  useOverlayHistory(panelOpen, flow.cancel);
  // useKeyboardStick оставляет последний inline-transform при выключении — чистим
  // его на закрытии, иначе keyboard-lift мог бы «залипнуть» на доке.
  useEffect(() => {
    if (!panelOpen) dockRef.current?.style.removeProperty('transform');
  }, [panelOpen, dockRef]);

  // Эксперимент-облик affordance «список еды» (см. LIST_CTA_VARIANTS).
  const { variant: listCta, anchor: listCtaAnchor } = useDesignVariant(
    'FoodListCta',
    LIST_CTA_VARIANTS
  );
  // tall-medal = монета-печать в trailing; иначе (tall-split) круг-иконка.
  const isMedalTrail = listCta === 'tall-medal';
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
      className={clsx(s.listCtaButton, panelOpen && s.listCtaDim)}
    />
  );

  // Ready-state: панель предложки открыта → free-text-инпут больше не нужен
  // (пишут в предложку, не в бар). Его место занимает заголовок «Предложения»,
  // перенесённый сюда из шапки SheetCard (`InlineWriteFoodReview`, 2026-07-02),
  // чтобы бар не был мёртвой полосой над панелью. Через `fieldOverride`: он
  // форсит collapsed → send-монета скрыта, а trailingSlot-медаль «Список» при
  // этом остаётся (dimmed) — оффлайн-путь виден, как и в resting-виде. WriteBarShell
  // гасит well-заливку пилюли на override (data-field-override) → заголовок лежит
  // плоско на плашке, а не в утопленном поле-слоте.
  const readyHeader = (
    <Heading as="h2" role="headline" className={s.readyHeader}>
      Предложения
    </Heading>
  );

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      // free-text-распознавание требует сети (LLM). Раньше офлайн молча гасился на
      // гейте WriteBarShell (`send.enabled = online && hasText`) ДО вызова submit —
      // ни предложки, ни фидбэка («предложка не появилась»). Теперь send включён
      // при любом тексте (computeSend ниже), а сеть проверяем здесь и сообщаем
      // тостером (канон freetext-error-toaster). Каталог («Список») — офлайн-путь.
      if (!online) {
        toaster.error('Нет сети — распознавание еды требует интернет. Добавьте через «Список».');
        // false → WriteBarShell (blurOnSubmit) НЕ блюрит: фокус остаётся, текст
        // сохранён, юзер может уйти в «Список» или повторить.
        return false;
      }
      flow.submit(trimmed);
    },
    [flow, online]
  );

  // Send-гейт: включаем при любом тексте (онлайн-гейт снят). Иначе офлайн-тап и
  // Enter молча гасились бы в WriteBarShell ДО offline-тостера в handleSubmit.
  const computeSend = useCallback(
    ({ hasText }: { hasText: boolean }): SendState => ({ visible: hasText, enabled: hasText }),
    []
  );

  return (
    <div className={s.dock} ref={dockRef} data-open={panelOpen || undefined}>
      <WriteBarShell
        // Во время `loading` поле пустеет (текст остаётся во flow.inputText для
        // retry по ошибке, но визуально уступает место плейсхолдеру «Распознаём…»
        // + спиннеру). На `ready` inputText уже '' (очищен на успехе), на `error`
        // — вернётся отправленный текст под правку.
        value={isLoading ? '' : flow.inputText}
        onChange={flow.setInputText}
        onSubmit={handleSubmit}
        // Tagged so the dock (when the panel is open) can strip the bar's raised
        // plate and sit it flush on the shared dock surface — «один кусок», по
        // паттерну Событий (см. `.bar` в FoodWriteBar.module.scss).
        className={s.bar}
        inputId={inputId}
        placeholder={isLoading ? LOADING_PLACEHOLDER : PLACEHOLDER}
        placeholderExamples={PLACEHOLDER_EXAMPLES}
        examplesActive={examplesActive}
        online={online}
        computeSend={computeSend}
        busy={isLoading}
        readOnly={isLoading}
        // На ready подменяем инпут заголовком «Предложения» (см. readyHeader).
        fieldOverride={panelOpen ? readyHeader : undefined}
        // На сабмите блюрим (клавиатура уходит) → бар садится в спокойный
        // pending-вид: спиннер-монета + «Распознаём…». Раньше фокус держался, чтобы
        // дотечь до панели-скелетона; теперь панели во время loading нет.
        blurOnSubmit
        hint={HINT}
        hintLabel={HINT_LABEL}
        minRows={1}
        trailingSlot={
          // «еда» справа от пилюли, в потоке, за фейдинг-дивайдером (не плавает,
          // не перекрывает список). Обёртка несёт DesignBar-анкор + оффлайн-эмфазу.
          <div className={s.listCtaTrail} data-net={netAttr} {...listCtaAnchor}>
            {isMedalTrail ? (
              // tall-medal: монета-печать в потоке (floating={false} → не уезжает
              // в плавающий режим, не сворачивается на фокусе). Облик paper +
              // внешний бордер, плоская (без тени) — задаётся в WriteBarMedal.
              <WriteBarMedal
                htmlFor={searchHtmlFor}
                ariaLabel={SEARCH_LABEL}
                img={FOOD_TILE_IMG}
                arcTop={ARC_TOP}
                arcBottom={ARC_BOTTOM}
                floating={false}
                dimmed={panelOpen}
              />
            ) : (
              ctaButton
            )}
          </div>
        }
      />

      {/* Панель предложки — НИЖЕ бара (паттерн Событий EventScalePanel): контент
          выступает естественным продолжением вниз, в место клавиатуры. Монтируется
          по флагу; свой внутренний скролл (max-height). Ошибку разбора ловит
          FeatureErrorBoundary (перенесена сюда из afterContent-слота Screen). */}
      {panelOpen && (
        <div className={s.reviewPanel}>
          <FeatureErrorBoundary label="Разбор еды">
            <InlineWriteFoodReview flow={flow} />
          </FeatureErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default FoodWriteBar;

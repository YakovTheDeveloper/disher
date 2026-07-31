import { useCallback, useEffect } from 'react';
import { WriteBarShell } from '@/shared/ui/WriteBarShell';
import type { SendState } from '@/shared/ui/WriteBarShell';
import { RoundButton } from '@/shared/ui/RoundButton';
import { HintButton } from '@/shared/ui/HintButton';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import fvBazaar from '@/shared/assets/icons/food-variants/fv-bazaar.svg';
import fvBasket from '@/shared/assets/icons/food-variants/fv-basket.svg';
import fvCrate from '@/shared/assets/icons/food-variants/fv-crate.svg';
import fvCart from '@/shared/assets/icons/food-variants/fv-cart.svg';
import fvFeast from '@/shared/assets/icons/food-variants/fv-feast.svg';
import fvFeastIso from '@/shared/assets/icons/food-variants/fv-feast-iso.svg';
import fvFeastRoast from '@/shared/assets/icons/food-variants/fv-feast-roast.svg';
import fvFeastToast from '@/shared/assets/icons/food-variants/fv-feast-toast.svg';
import fvFeastCake from '@/shared/assets/icons/food-variants/fv-feast-cake.svg';
import fvReceipt from '@/shared/assets/icons/food-variants/fv-receipt.svg';
import fvClipboard from '@/shared/assets/icons/food-variants/fv-clipboard.svg';
import fvPlateList from '@/shared/assets/icons/food-variants/fv-plate-list.svg';
import fvCornucopia from '@/shared/assets/icons/food-variants/fv-cornucopia.svg';
import fvCornucopiaB from '@/shared/assets/icons/food-variants/fv-cornucopia-b.svg';
import fvCornucopiaC from '@/shared/assets/icons/food-variants/fv-cornucopia-c.svg';
import fvCornucopiaD from '@/shared/assets/icons/food-variants/fv-cornucopia-d.svg';
import fvScale from '@/shared/assets/icons/food-variants/fv-scale.svg';
import fvShelf from '@/shared/assets/icons/food-variants/fv-shelf.svg';
import { Heading } from '@/shared/ui/atoms/Typography';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import toaster from '@/shared/lib/toaster/toaster';
import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { FeatureErrorBoundary } from '@/shared/ui/error/FeatureErrorBoundary';
import type { UseWriteFoodFlowResult } from '../../model/useWriteFoodFlow';
import { InlineWriteFoodReview } from '../InlineWriteFoodReview';
import s from './FoodWriteBar.module.scss';

// Дуговые подписи медальона-печати «Список еды / вручную» (верх/низ, как на монете).
const ARC_TOP = 'Список еды';
const ARC_BOTTOM = '';
// Фоновая гравюра плитки — клош (cloche / room-service dome).
const FOOD_TILE_IMG = '/art/plate.png';

// Варианты гравюры медали «Список еды» — переключаются из dev-DesignBar (ключ
// `FoodListMedalIcon`, выбор персистится в localStorage). Первый — дефолт
// (растровый клош на flat-печати). Остальные — белые силуэт-гравюры в каноне
// event-variants (жирный силуэт, минимум прорезей), и медаль при их выборе
// инвертируется в тёмную elevated-монету — как «Новое событие». Мотивы —
// скопление еды: рынок (тент, корзина, ящик, весы), супермаркет (тележка,
// стеллаж), изобилие (рог), пир (стол, изо-стол, жаркое, тост, торт),
// «список» буквально (чек, планшет, тарелка-меню).
const FOOD_ICON_VARIANTS = [
  'plate',
  'bazaar',
  'basket',
  'crate',
  'cart',
  'feast',
  'feast-iso',
  'feast-roast',
  'feast-toast',
  'feast-cake',
  'cornucopia',
  'cornucopia-b',
  'cornucopia-c',
  'cornucopia-d',
  'scale',
  'shelf',
  'receipt',
  'clipboard',
  'plate-list',
] as const;

type FoodIconVariant = (typeof FOOD_ICON_VARIANTS)[number];

const FOOD_ICONS: Record<Exclude<FoodIconVariant, 'plate'>, string> = {
  bazaar: fvBazaar,
  basket: fvBasket,
  crate: fvCrate,
  cart: fvCart,
  feast: fvFeast,
  'feast-iso': fvFeastIso,
  'feast-roast': fvFeastRoast,
  'feast-toast': fvFeastToast,
  'feast-cake': fvFeastCake,
  cornucopia: fvCornucopia,
  'cornucopia-b': fvCornucopiaB,
  'cornucopia-c': fvCornucopiaC,
  'cornucopia-d': fvCornucopiaD,
  scale: fvScale,
  shelf: fvShelf,
  receipt: fvReceipt,
  clipboard: fvClipboard,
  'plate-list': fvPlateList,
};
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
// Для входа «Предложить продукты» (intake 'dishName') вместо плейсхолдера —
// заголовок «Изучаем блюдо…» (см. loadingHeader): без него не было понятно,
// что бар вообще что-то анализирует.
const LOADING_PLACEHOLDER = 'Распознаём…';
const LOADING_DISH_TITLE = 'Изучаем блюдо…';

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

// Подсказка free-text-бара — за ⓘ в доке над баром (бумажка-поповер, а не инлайн-
// раскрытие, 2026-07-17). Два абзаца: что делает бар + формат ввода, и зачем нужно
// онлайн-распознавание. Выделение действий/понятий — тегом <strong> (вес): Onest
// без курсива. Пример формата в самом баре живёт отдельно (PLACEHOLDER_EXAMPLES).
const FREETEXT_HINT = (
  <>
    <p>
      Этот бар превращает <strong>рукописную строку</strong> в карточки расписания. Пишите свободно,
      как в заметке: время, еду и вес в граммах — например,{' '}
      <strong>«9:40 гречка 80, яйцо 80, хлеб 100»</strong>. Время и вес необязательны, но с ними
      разбор точнее.
    </p>
    <p>
      Распознавание работает <strong>только онлайн</strong>: оно нужно, чтобы{' '}
      <strong>структурировать</strong> еду для анализа и подтянуть её нутриенты.
    </p>
  </>
);

// Подсказки по правке разбора — за ⓘ в шапке предложки «Все верно?». Два абзаца:
// как работает распознавание (онлайн, каталог, два жеста правки) и зачем оно нужно.
// Выделение действий — тегом <strong> (вес), а не курсивом: Onest без курсива.
const REVIEW_HINT = (
  <>
    <p>
      Режим «рукописный текст → карточки» работает только онлайн. Еда из базового каталога
      распознаётся; если нет — можно либо <strong>заменить</strong> предложенную еду, кликнув на
      название, либо <strong>добавить</strong> эту еду в свою коллекцию, кликнув на плюсик.
    </p>
    <p>
      Распознавание нужно, чтобы структурировать еду для анализа, а также чтобы получить её
      нутриенты.
    </p>
  </>
);

export interface FoodWriteBarProps {
  /** free-text-food flow (см. `useWriteFoodFlow`). */
  flow: UseWriteFoodFlowResult;
  /** id для `<input>`/`<textarea>` — должен совпадать с `htmlFor` у внешних триггеров. */
  inputId: string;
  /** htmlFor медали → SEARCH_INPUT create-флоу таргета (открывает каталог). */
  searchHtmlFor: string;
  /** Гейт «список айтемов пуст» — карусель примеров показывается только тогда. */
  examplesActive?: boolean;
  /**
   * Тематический заголовок над баром на фокусе — свой у каждого экрана (Рацион vs
   * блюдо), потому торчит наружу (единственный текст-проп при общей конвергенции).
   */
  focusTitle?: string;
}

/**
 * Нижний док добавления еды для двух экранов (Рацион `FoodSchedule` + блюдо
 * `DishBuilderPage`): free-text write-бар над общим `WriteBarShell` + медаль-
 * печать «Список еды / вручную» (`RoundButton`), открывающая каталог. Поглотил
 * бывший `WriteFoodInput` (нет второго потребителя → слой-индирекция убран,
 * 2026-06-25) и редундантную пару `AppBottomBar`(write) + `raisedFoodDock`.
 *
 * Весь облик и тексты вшиты (максимальная конвергенция экранов); наружу торчат
 * только функциональные пропы. Вход «список еды» едет в `trailingSlot` высокого
 * бара (в потоке, за фейдинг-дивайдером, не перекрывает список) — облик = монета-
 * печать `RoundButton` (канон-медальон «Список еды / вручную»).
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
  focusTitle,
}: FoodWriteBarProps) => {
  const online = useOnline();
  const { variant: medalIcon, anchor: medalAnchor } = useDesignVariant(
    'FoodListMedalIcon',
    FOOD_ICON_VARIANTS
  );
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

  // Приглушение верхнего бара (HomeTopBar) на открытой панели больше НЕ живёт тут:
  // WriteBarShell ставит `data-writebar-dim` на свой корень `.wrap` (здесь — через
  // `overlayVisible={panelOpen}`), а SwipeDeck кроет полосу бара отдельным скримом
  // ТОЛЬКО когда дим-бар лежит на видимом слайде (см. SwipeDeck `.topBarScrim`).

  // Ready-state: панель предложки открыта → free-text-инпут больше не нужен
  // (пишут в предложку, не в бар). Его место занимает заголовок «Все верно?»,
  // перенесённый сюда из шапки SheetCard (`InlineWriteFoodReview`, 2026-07-02),
  // чтобы бар не был мёртвой полосой над панелью. Через `fieldOverride`: он
  // форсит collapsed → send-монета скрыта; медаль «Список» на это время снята
  // (см. trailingSlot), поэтому полоса принадлежит заголовку целиком и он стоит
  // по центру. WriteBarShell гасит well-заливку пилюли на override
  // (data-field-override) → заголовок лежит плоско на плашке, а не в утопленном
  // поле-слоте.
  const readyHeader = (
    <div className={s.readyHeader}>
      <Heading as="h2" role="title" className={s.readyHeaderTitle}>
        Все верно?
      </Heading>
      {/* ⓘ top-right — тот же канон-примитив, что подсказка в шапке модалки еды
          (HintButton = InfoButton + PopoverTrigger). Место в правом инсете
          пилюли освобождает снятая на открытой панели медаль «Список». */}
      <span className={s.readyHint}>
        <HintButton hint={REVIEW_HINT} ariaLabel="Подсказки по разбору" size={40} glyphSize={20} />
      </span>
    </div>
  );

  // Loading «Предложить продукты»: голый спиннер-монета не читался как «идёт
  // анализ» (запрос 2026-07-29) → подменяем поле заголовком по тому же
  // fieldOverride-паттерну, что readyHeader. Спиннер НЕ гасится (showSpinner =
  // busy рендерится вне fieldOverride) — заголовок + монета вместе несут статус.
  // Только для intake 'dishName': рукописный разбор остаётся на плейсхолдере
  // «Распознаём…» (текст юзера в поле — уже контекст происходящего).
  const loadingHeader =
    isLoading && flow.intake === 'dishName' ? (
      <div className={s.readyHeader}>
        <Heading as="h2" role="headline" className={s.readyHeaderTitle}>
          {LOADING_DISH_TITLE}
        </Heading>
      </div>
    ) : undefined;

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
        // На ready подменяем инпут заголовком «Предложения» (см. readyHeader),
        // на loading «Предложить продукты» — «Изучаем блюдо…» (см. loadingHeader).
        fieldOverride={panelOpen ? readyHeader : loadingHeader}
        // Пока предложка открыта — держим тёмный дим-бэкдроп на странице, чтобы
        // подсветить нижний док (бар + панель). `fieldOverride` схлопывает
        // `expanded`, поэтому фокус сам дим не удержит — форсим его флагом.
        overlayVisible={panelOpen}
        // На сабмите блюрим (клавиатура уходит) → бар садится в спокойный
        // pending-вид: спиннер-монета + «Распознаём…». Раньше фокус держался, чтобы
        // дотечь до панели-скелетона; теперь панели во время loading нет.
        blurOnSubmit
        hintPopover={FREETEXT_HINT}
        focusTitle={focusTitle}
        minRows={1}
        trailingSlot={
          // «еда» справа от пилюли, в потоке, за фейдинг-дивайдером (не плавает,
          // не перекрывает список). Монета-печать в потоке (floating={false} → не
          // уезжает в плавающий режим, не сворачивается на фокусе). Облик — по
          // DesignBar-варианту `FoodListMedalIcon`: дефолт — растровый клош на
          // flat-печати («часть панели»), гравюры — белый силуэт на тёмной
          // elevated-монете (инверсия, как у медали «Новое событие»).
          //
          // На открытой предложке медали НЕТ: каталог сейчас не путь (юзер правит
          // разбор), а её отсутствие отдаёт полосу целиком заголовку — он встаёт
          // по центру бара, а не жмётся влево от монеты.
          panelOpen ? undefined : (
            <div className={s.listCtaTrail} {...medalAnchor}>
              <RoundButton
                htmlFor={searchHtmlFor}
                ariaLabel={SEARCH_LABEL}
                img={medalIcon === 'plate' ? FOOD_TILE_IMG : FOOD_ICONS[medalIcon]}
                // Гравюры рисуются полноформатными (1024², белый силуэт) под тёмный
                // elevated-диск, клош-png — 75% на flat-печати (см. FOOD_ICON_VARIANTS).
                {...(medalIcon === 'plate'
                  ? { imgWidth: '75%', imgNudgeY: '2px', look: 'flat' as const }
                  : { look: 'elevated' as const })}
                arcTop={ARC_TOP}
                arcBottom={ARC_BOTTOM}
                floating={false}
              />
            </div>
          )
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

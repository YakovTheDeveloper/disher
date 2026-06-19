import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { format } from 'date-fns';
import {
  useDish,
  useDishItemsWithProducts,
  useDishPortions,
  updateDishName,
  removeDishItem,
  addDishPortion,
  updateDishPortion,
  removeDishPortion,
} from '@/entities/dish';
import { ChangeNameModal, CHANGE_NAME_INPUT_ID } from '@/features/shared/change-name';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { Screen, TopBarScrollHideContext, useTopBarScrollHideController } from '@/shared/ui/Screen';
import {
  useWriteFoodFlow,
  getWriteFoodInputId,
  InlineWriteFoodReview,
} from '@/features/food/food-free-text-parse';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import { LongPressRow } from '@/features/shared/long-press-item';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Quantity } from '@/shared/ui/Quantity';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import styles from './DishBuilderPage.module.scss';
import homeStyles from '@/pages/home-page/HomePage.module.scss';
import {
  DishProductCreateModals,
  DISH_MODAL_INPUT_IDS,
  DishProductEditModals,
  DISH_EDIT_MODAL_INPUT_IDS,
  useDishProductFlow,
} from './ui';
import {
  FoodPortionsManager,
  PortionCreateModals,
  AddPortionButton,
} from '@/features/food/food-portions-manager';
import { DishAnalysisScreen } from '@/features/dish-analysis';
import { useDishNutrientTotals } from '@/entities/dish';
import { ItemActionsDrawer, buildInfoActions } from '@/features/shared/item-actions-drawer';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { AppBottomBar } from '@/shared/ui/AppBottomBar';
import { SuggestActionButton } from '@/shared/ui/SuggestActionButton';
import { drawerStore } from '@/shared/ui/drawer-store';
import { SuggestIngredientsClarifyDrawer } from '@/features/food/food-free-text-parse/ui/SuggestIngredientsClarifyDrawer';
import { NutrientsDrawer } from '@/widgets/nutrients/NutrientsDrawer';
import { NutrientsBar } from '@/widgets/FoodSchedule/NutrientsBar';
import jazzImg from '@/shared/assets/decarative/jazz.png';
import bagImg from '@/shared/assets/decarative/bag3.png';
import moneyImg from '@/shared/assets/decarative/money.png';

type DishItemWithProduct = {
  id: string;
  productId: string;
  quantity: number;
  details: string;
  product: { name: string | null } | null;
};

const DISH_SCREENS: ScreenEntry[] = [
  { label: 'Анализ', image: jazzImg, titleStyle: 'display-sans' },
  { label: 'Ингредиенты', image: bagImg, titleStyle: 'display-sans' },
  { label: 'Порции', image: moneyImg, titleStyle: 'display-sans' },
];

const DEFAULT_SLIDE = 1;
const SWIPE_DURATION = 25;

// SwitcherTab ambient — radial-glow per nth-child (см. SwitcherTab.module.scss).
// Дефолтная семантика тайла (inverse-lift) уже в base-стилях; этот anchor
// добавляет цветную подсветку каждой плитке отдельно — аналог ProductAmbient,
// но per-tile. HomePage anchor не использует.
// Первый элемент = дефолт (см. useDesignVariant fallback). `ice-blue` —
// subtle голубоватый glow, согласуется с ProductAmbient.ice-blue фоном
// страницы. Остальные — моно-tone subtle палитры; `none` сохранён как
// явный off-вариант для отладки.
const SWITCHER_TAB_AMBIENT_VARIANTS = [
  'ice-blue',
  'paper-warm',
  'mint-fog',
  'lavender-haze',
  'peach-fog',
  'silver-mist',
  'rose-quartz',
  'none',
] as const;

const DishBuilderPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    console.error('Dish ID is required but not found in URL');
    return null;
  }

  // id-guard живёт в обёртке (до return — только useParams, Rules of React ок).
  // Всё тело с хуками — в Inner, который получает гарантированный id: string,
  // поэтому ни один хук не вызывается условно (react-hooks/rules-of-hooks).
  return <DishBuilderPageInner id={id} />;
};

const DishBuilderPageInner = ({ id }: { id: string }) => {
  const dish = useDish(id);
  const dishItems = useDishItemsWithProducts(id);
  const portionsRaw = useDishPortions(id);
  const dishTotals = useDishNutrientTotals(id);

  const navigate = useNavigate();
  const location = useLocation();

  const [renameOpen, setRenameOpen] = useState(false);
  const handleNameFocusCapture = useCallback((e: React.FocusEvent) => {
    if ((e.target as HTMLElement).id === CHANGE_NAME_INPUT_ID) {
      setRenameOpen(true);
    }
  }, []);
  const openNutrients = useCallback(() => {
    void drawerStore.show(
      NutrientsDrawer,
      { totals: dishTotals },
      { side: 'left', width: 'min(85vw, 360px)' },
    );
  }, [dishTotals]);
  // Сумма нутриентов блюда — 1:1 с HomePage: полоса-сводка (NutrientsBar) в
  // конце списка ингредиентов, а не пилюля верхнего бара (пилюлю убрали
  // 2026-06-19). Тот же dishTotals открывает тот же NutrientsDrawer слева.
  const editFlow = useDishProductFlow({ type: 'edit' });

  const writeFoodTarget = useMemo(
    () => ({ kind: 'dish' as const, dishId: id }),
    [id],
  );
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

  const swipeableRef = useRef<SwipeableRef>(null);

  // Направление-зависимое скрытие кнопок бара при скролле (см. topBarScrollHide).
  // Экран «Разбор» прячет всё (кроме «Назад»), Ингредиенты/Порции — только
  // настройки. Контроллер пишет в DOM императивно → zero-React-render.
  const { shellRef, setHide, api: topBarHideApi } = useTopBarScrollHideController();
  // Смена слайда → бар возвращается видимым (новый экран читается «с верха»).
  const handleIndexChange = useCallback(() => setHide('none'), [setHide]);

  const startEdit = editFlow.startEdit;
  const handleEditQuantity = useCallback(
    (item: DishItemWithProduct) => startEdit(item, 'quantity'),
    [startEdit]
  );

  const itemsRef = useRef(dishItems);
  // Освежаем ref в эффекте, не в рендере (react-hooks/refs: запись ref.current
  // во время рендера небезопасна для компилятора). itemsRef читается только в
  // обработчике фокуса — он срабатывает после рендера, рассинхрона нет.
  useEffect(() => {
    itemsRef.current = dishItems;
  });
  const primeEdit = editFlow.primeEdit;
  const handleEditFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.id !== DISH_EDIT_MODAL_INPUT_IDS.DETAILS_INPUT) return;
      const itemId = target.dataset.activeItemId;
      if (!itemId) return;
      const item = itemsRef.current.find((it) => it.id === itemId);
      if (!item) return;
      primeEdit(item);
    },
    [primeEdit]
  );

  // HomeTopBar is date-aware (click on date-segment → ScheduleNavigatorDrawer
  // → navigate to /schedule/<date>). Dish has no date — show "К расписанию"
  // override text, but keep the underlying drawer+navigation so the button
  // remains a useful escape hatch back to the schedule.
  const dateForTopBar = useMemo(() => {
    if (typeof window === 'undefined') return format(new Date(), 'dd-MM-yyyy');
    const stored = window.localStorage.getItem('lastVisitedScheduleDate');
    return stored ?? format(new Date(), 'dd-MM-yyyy');
  }, []);

  // Back ведёт на реальный origin (state.from), фолбэк — последняя посещённая
  // дата расписания. PUSH на явный URL (popstate-back RR намеренно не анимирует).
  const backTo =
    (location.state as { from?: string } | null)?.from ?? `/schedule/${dateForTopBar}`;

  // Свайп не прокидывается в стейт: каждый слайд рендерит свой статичный
  // ScreenIndicator (slideIndex={0/1/2}). Тот же паттерн, что HomePage.
  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
  }, []);

  const { anchor: switcherTabAnchor } = useDesignVariant(
    'SwitcherTabAmbient',
    SWITCHER_TAB_AMBIENT_VARIANTS,
  );

  // Инстансы индикатора держим стабильными (useMemo на стабильном
  // handleSelect) по канону HomePage. Прямого выигрыша от memo(Screen) тут
  // нет — соседние пропы Screen (children/actions/...) инлайн-JSX, memo
  // пробивается всё равно; вреда тоже нет.
  // bandImg={false}: крупная бледная картинка активного экрана снята (юзер: «от
  // этого уже ушли») — паритет с HomePage-индикаторами. Мелкие картинки в самих
  // SwitcherTab остаются.
  const analysisIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={DISH_SCREENS}
        onSelect={handleSelect}
        slideIndex={0}
        bandImg={false}
      />
    ),
    [handleSelect],
  );
  const ingredientsIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={DISH_SCREENS}
        onSelect={handleSelect}
        slideIndex={1}
        bandImg={false}
      />
    ),
    [handleSelect],
  );
  const portionsIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={DISH_SCREENS}
        onSelect={handleSelect}
        slideIndex={2}
        bandImg={false}
      />
    ),
    [handleSelect],
  );

  // ── Порции блюда: создание 2-шаговой модалкой + удаление long-press → drawer ──
  // Адаптер прячет хранение: блюдо = таблица dish_portions по id (label→id-мап).
  // PortionCreateModals (с внутренним usePortionFlow) — общий с ProductPage.
  const portionLabels = useMemo(() => portionsRaw.map((p) => p.label), [portionsRaw]);
  const createPortion = (portion: { label: string; grams: number }) =>
    void safeMutate(() => addDishPortion(id, portion), 'Не удалось добавить порцию');
  const deletePortion = (label: string) => {
    const portion = portionsRaw.find((p) => p.label === label);
    if (portion)
      void safeMutate(() => removeDishPortion(portion.id), 'Не удалось удалить порцию');
  };
  const updatePortion = (
    label: string,
    updates: Partial<{ label: string; grams: number }>,
  ) => {
    const portion = portionsRaw.find((p) => p.label === label);
    if (portion)
      void safeMutate(() => updateDishPortion(portion.id, updates), 'Не удалось обновить порцию');
  };
  const openPortionDeleteDrawer = (label: string) => {
    void drawerStore.show(ItemActionsDrawer, {
      title: label,
      onDelete: () => deletePortion(label),
      actions: [],
    });
  };

  if (!dish) return null;

  const items = dishItems;

  // Имя блюда в `contentHeader` каждого Screen. `<label>` лежит ВНУТРИ heading-а
  // и оборачивает span — валидный HTML (label принимает phrasing content),
  // и при этом heading рендерится как `<h2>` чтобы у страницы остался один
  // `<h1>`. Дублирование contentHeader в 3 Screen-ах не плодит h1 в DOM.
  // Клик по label → focus на input ChangeNameModal.
  const nameHeading = (
    <Heading size="section" as="h2">
      <label htmlFor={CHANGE_NAME_INPUT_ID} aria-label="Изменить название">
        <span>{dish.name}</span>
      </label>
    </Heading>
  );

  // Long-press → per-item action drawer: delete (top-right) + «Информация о
  // продукте» → product page.
  const openActionsDrawer = (item: DishItemWithProduct) => {
    void drawerStore.show(ItemActionsDrawer, {
      title: item.product?.name ?? 'Продукт',
      onDelete: async () => {
        const res = await safeMutate(() => removeDishItem(item.id), 'Не удалось удалить');
        if (res.ok) toaster.success('Удалено');
      },
      // Dish ingredients are always products → reuse the shared guard.
      actions: buildInfoActions({ type: 'food', productId: item.productId, dishId: null }, navigate),
    });
  };

  // Semantic suggest: grab the dish name → head A → matched ingredients land
  // in InlineWriteFoodReview below the list. rAF waits for the skeleton render
  // (which carries [data-write-food-anchor]) before scrolling it into view.
  const handleSuggestIngredients = async () => {
    // Optional «Уточнения» step: undefined = cancelled/swipe-dismissed (don't
    // suggest); any string (incl. '') = proceed, the comment rides into head A.
    const comment = await drawerStore.show(SuggestIngredientsClarifyDrawer, {});
    if (comment === undefined) return;
    writeFoodFlow.submitDishName(dish.name, comment);
    requestAnimationFrame(() => {
      document
        .querySelector('[data-write-food-anchor]')
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };

  return (
    // NavSwitcher tab-as-title — каноничный облик табов экранов (как на HomePage):
    // активный раздел = крупный заголовок, неактивные — тихие serif-указатели.
    // Хардкод-атрибут (а не useDesignVariant) намеренно: облик зафиксирован и не
    // делит персист-ключ `dv:NavSwitcher` с HomePage. Квадрат ретайрнут 2026-06-19.
    <div className={homeStyles.container} data-dv="NavSwitcher" data-dv-v="tab-as-title">
      <HomeTopBar
        date={dateForTopBar}
        backSlot={<BackButton to={backTo} />}
        dateButtonLabel={<CalendarIcon width={22} height={22} />}
        noInterruptGuard
        shellRef={shellRef}
      />
      <div onFocusCapture={handleNameFocusCapture}>
        <ChangeNameModal
          currentName={dish.name}
          isExpanded={renameOpen}
          onClose={() => setRenameOpen(false)}
          onChangeName={(name) => {
            void safeMutate(() => updateDishName(dish.id, name), 'Не удалось переименовать');
            setRenameOpen(false);
          }}
        />
      </div>
      <div className={homeStyles.swipeArea} {...switcherTabAnchor}>
        <TopBarScrollHideContext.Provider value={topBarHideApi}>
        <Swipeable
          ref={swipeableRef}
          defaultSlide={DEFAULT_SLIDE}
          duration={SWIPE_DURATION}
          hasDots={false}
          onIndexChange={handleIndexChange}
        >
          <Screen
            key={1}
            headerOverlap
            contentHeader={nameHeading}
            stickyTop={analysisIndicator}
            topBarHide="all"
          >
            <DishAnalysisScreen dishId={id} hasIngredients={items.length > 0} />
          </Screen>

          <Screen
            key={2}
            headerOverlap
            contentHeader={nameHeading}
            stickyTop={ingredientsIndicator}
            topBarHide="settings"
            headerAction={
              <SuggestActionButton
                label="Предложить ингредиенты"
                // Disable while parsing AND when the dish has no name yet —
                // submitDishName('') is a silent no-op otherwise.
                disabled={writeFoodFlow.state === 'loading' || !dish.name.trim()}
                onClick={() => void handleSuggestIngredients()}
              />
            }
            overlay={
              <>
                <DishProductCreateModals dishId={id} />
                <div onFocusCapture={handleEditFocusCapture}>
                  <DishProductEditModals flow={editFlow} />
                </div>
                {/* WriteFoodModals overlay убран 2026-05-23: AutoGrowSearch
                    теперь живёт прямо в AppBottomBar через WriteFoodInput.
                    Дубликат `<input id={writeFoodInputId}>` в DOM дал бы конфликт. */}
              </>
            }
            bottomBar={
              <AppBottomBar
                writeFoodFlow={writeFoodFlow}
                writeFoodInputId={writeFoodInputId}
                searchHtmlFor={DISH_MODAL_INPUT_IDS.SEARCH_INPUT}
                searchLabel="Найти продукт"
                searchText="выбрать из списка"
                writeFoodPlaceholder="Опишите ингредиенты…"
              />
            }
            afterContent={
              /* Предложка в afterContent-слоте Screen (паритет с FoodSchedule):
                 результат typed-text-бара И кнопки «Предложить ингредиенты»
                 плавает на фоне страницы под листом со списком. Несёт
                 [data-write-food-anchor] — без него «Посмотреть варианты» в
                 баре скроллил в пустоту (живой баг до 2026-06-05). */
              <InlineWriteFoodReview flow={writeFoodFlow} />
            }
          >
            <div className={styles.dishItemsGroup}>
            <ItemsList offsetTop>
              {items.map((item, index) => (
                <LongPressRow
                  key={item.id}
                  id={item.id}
                  index={index}
                  className={styles.group}
                  innerClassName={styles.dishFoodListItem}
                  onLongPress={() => openActionsDrawer(item)}
                >
                  {/* Колонка = <label htmlFor={DETAILS_INPUT}>: тап по имени ИЛИ
                      по сабтайтлу уточнения открывает редактор деталей (паритет
                      с HomePage foodCol). FoodName БЕЗ htmlFor → рендерит <p>, не
                      вложенный <label> (иначе невалидный HTML). onPointerDown
                      стэшит activeItemId до focus — его читает handleEditFocusCapture. */}
                  <label
                    className={styles.foodCol}
                    htmlFor={DISH_EDIT_MODAL_INPUT_IDS.DETAILS_INPUT}
                    onPointerDown={() => {
                      const trigger = document.getElementById(
                        DISH_EDIT_MODAL_INPUT_IDS.DETAILS_INPUT
                      );
                      if (trigger) trigger.dataset.activeItemId = item.id;
                    }}
                  >
                    <FoodName
                      content={{ name: item.product?.name ?? item.productId }}
                    />
                    {item.details ? (
                      <span className={styles.detailsSubtitle}>{item.details}</span>
                    ) : null}
                  </label>
                  <Quantity
                    htmlFor={DISH_EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT}
                    id={item.id}
                    onClick={() => handleEditQuantity(item)}
                    hide={false}
                    unit="г"
                    content={{ quantity: item.quantity }}
                  />
                </LongPressRow>
              ))}
            </ItemsList>
            </div>
            {/* Полоса-сводка нутриентов блюда — в конце списка (паритет с
                FoodSchedule). На пустом блюде не показываем. */}
            {items.length > 0 && (
              <NutrientsBar totals={dishTotals} onOpen={openNutrients} />
            )}
          </Screen>

          <Screen
            key={3}
            headerOverlap
            contentHeader={nameHeading}
            stickyTop={portionsIndicator}
            topBarHide="settings"
            bottomBar={<AddPortionButton />}
            overlay={
              <PortionCreateModals
                // «Всё блюдо» — производная строка implicitPortion; добавляем в
                // reserved-список, чтобы юзер не создал порцию-двойник.
                existingLabels={
                  items.length > 0 ? [...portionLabels, 'Всё блюдо'] : portionLabels
                }
                unit="г"
                onCreate={createPortion}
              />
            }
          >
            <FoodPortionsManager
              portions={portionsRaw.map((p) => ({
                label: p.label,
                grams: p.grams,
              }))}
              implicitPortion={
                items.length > 0
                  ? {
                      label: 'Всё блюдо',
                      grams: items.reduce((sum, it) => sum + it.quantity, 0),
                    }
                  : undefined
              }
              showHint={false}
              onUpdate={updatePortion}
              onLongPressRow={openPortionDeleteDrawer}
            />
          </Screen>
        </Swipeable>
        </TopBarScrollHideContext.Provider>
      </div>
    </div>
  );
};

export default DishBuilderPage;

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
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
import { Screen } from '@/shared/ui/Screen';
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
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { AppBottomBar, NutrientsSummaryButton } from '@/shared/ui/AppBottomBar';
import { drawerStore } from '@/shared/ui/drawer-store';
import { NutrientsDrawer } from '@/widgets/nutrients/NutrientsDrawer';
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

// NavTile ambient — radial-glow per nth-child (см. NavTile.module.scss).
// Дефолтная семантика тайла (inverse-lift) уже в base-стилях; этот anchor
// добавляет цветную подсветку каждой плитке отдельно — аналог ProductAmbient,
// но per-tile. HomePage anchor не использует.
// Первый элемент = дефолт (см. useDesignVariant fallback). `ice-blue` —
// subtle голубоватый glow, согласуется с ProductAmbient.ice-blue фоном
// страницы. Остальные — моно-tone subtle палитры; `none` сохранён как
// явный off-вариант для отладки.
const NAVTILE_AMBIENT_VARIANTS = [
  'ice-blue',
  'paper-warm',
  'mint-fog',
  'lavender-haze',
  'peach-fog',
  'silver-mist',
  'rose-quartz',
  'none',
] as const;

// Sparkle — the "infer recipe" affordance icon (head A semantic suggest).
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5l1.6 4.9a4 4 0 0 0 2.5 2.5l4.9 1.6-4.9 1.6a4 4 0 0 0-2.5 2.5L12 20.5l-1.6-4.9a4 4 0 0 0-2.5-2.5L3 11.5l4.9-1.6a4 4 0 0 0 2.5-2.5L12 2.5z" />
  </svg>
);

const DishBuilderPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    console.error('Dish ID is required but not found in URL');
    return null;
  }

  const dish = useDish(id);
  const dishItems = useDishItemsWithProducts(id);
  const portionsRaw = useDishPortions(id);
  const dishTotals = useDishNutrientTotals(id);

  const navigate = useNavigate();

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
  // Калории-пилюля в центре топбара — 1:1 с HomePage (унификация двух экранов).
  // Раньше жила в AppBottomBar.leadingSlot и только на экране «Ингредиенты»;
  // теперь видна на всех трёх экранах блюда, как nutrients-pill на HomePage.
  const topBarCenterSlot = useMemo(
    () => <NutrientsSummaryButton totals={dishTotals} onClick={openNutrients} />,
    [dishTotals, openNutrients],
  );
  const editFlow = useDishProductFlow({ type: 'edit' });

  const writeFoodTarget = useMemo(
    () => ({ kind: 'dish' as const, dishId: id }),
    [id],
  );
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

  const swipeableRef = useRef<SwipeableRef>(null);

  const startEdit = editFlow.startEdit;
  const handleEditQuantity = useCallback(
    (item: DishItemWithProduct) => startEdit(item, 'quantity'),
    [startEdit]
  );

  const itemsRef = useRef(dishItems);
  itemsRef.current = dishItems;
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

  // Свайп не прокидывается в стейт: каждый слайд рендерит свой статичный
  // ScreenIndicator (slideIndex={0/1/2}). Тот же паттерн, что HomePage.
  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
  }, []);

  const { anchor: navTileAnchor } = useDesignVariant('NavTileAmbient', NAVTILE_AMBIENT_VARIANTS);

  // Инстансы индикатора держим стабильными (useMemo на стабильном
  // handleSelect) по канону HomePage. Прямого выигрыша от memo(Screen) тут
  // нет — соседние пропы Screen (children/actions/...) инлайн-JSX, memo
  // пробивается всё равно; вреда тоже нет.
  // bandImg={false}: крупная бледная картинка активного экрана снята (юзер: «от
  // этого уже ушли») — паритет с HomePage-индикаторами. Мелкие картинки в самих
  // NavTile остаются.
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
  const handleSuggestIngredients = () => {
    writeFoodFlow.submitDishName(dish.name);
    requestAnimationFrame(() => {
      document
        .querySelector('[data-write-food-anchor]')
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };

  return (
    <div className={homeStyles.container}>
      <HomeTopBar
        date={dateForTopBar}
        dateButtonLabel={<CalendarIcon width={22} height={22} />}
        centerSlot={topBarCenterSlot}
        noInterruptGuard
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
      <div className={homeStyles.swipeArea} {...navTileAnchor}>
        <Swipeable
          ref={swipeableRef}
          defaultSlide={DEFAULT_SLIDE}
          duration={SWIPE_DURATION}
          hasDots={false}
        >
          <Screen
            key={1}
            headerOverlap
            contentHeader={nameHeading}
            stickyTop={analysisIndicator}
          >
            <DishAnalysisScreen dishId={id} hasIngredients={items.length > 0} />
          </Screen>

          <Screen
            key={2}
            headerOverlap
            contentHeader={nameHeading}
            stickyTop={ingredientsIndicator}
            hollow={items.length === 0}
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
                searchText="Выбор еды"
                writeFoodPlaceholder="Опишите ингредиенты…"
              />
            }
          >
            <div className={styles.suggestRow}>
              <button
                type="button"
                className={styles.suggestButton}
                // Disable while parsing AND when the dish has no name yet —
                // submitDishName('') is a silent no-op otherwise.
                disabled={writeFoodFlow.state === 'loading' || !dish.name.trim()}
                onClick={handleSuggestIngredients}
              >
                <span className={styles.suggestButtonIcon} aria-hidden="true">
                  <SparkleIcon />
                </span>
                Предложить ингредиенты
              </button>
            </div>
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
            {/* Предложка под списком (паритет с FoodSchedule): результат и
                typed-text-бара, и кнопки «Предложить ингредиенты» рендерится
                здесь. Несёт [data-write-food-anchor] — без него «Посмотреть
                варианты» в баре скроллил в пустоту (живой баг до 2026-06-05). */}
            <InlineWriteFoodReview flow={writeFoodFlow} />
          </Screen>

          <Screen
            key={3}
            headerOverlap
            contentHeader={nameHeading}
            stickyTop={portionsIndicator}
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
      </div>
    </div>
  );
};

export default DishBuilderPage;

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
} from '@/features/food/food-free-text-parse';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import { LongPressRow } from '@/features/shared/long-press-item';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Quantity } from '@/shared/ui/Quantity';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import styles from './DishBuilderPage.module.scss';
import homeStyles from '@/pages/home-page/HomePage.module.scss';
import {
  DishProductCreateModals,
  DISH_MODAL_INPUT_IDS,
  DishProductEditModals,
  DISH_EDIT_MODAL_INPUT_IDS,
  DishSuggestionsModal,
  useDishProductFlow,
} from './ui';
import { FoodPortionsManager, nextDefaultPortionLabel } from '@/features/food/food-portions-manager';
import { DishAnalysisScreen } from '@/features/dish-analysis';
import { useDishNutrientTotals } from '@/entities/dish';
import { ItemActionsDrawer, buildInfoActions } from '@/features/shared/item-actions-drawer';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';
import { PlusIcon } from '@/shared/ui/atoms/Button/AddButton/AddButton';
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

// Общий ambient-anchor со страницей продукта (CSS в HomePage.module.scss) —
// детальные экраны продукта и блюда делят одну голубую подложку.
const PRODUCT_AMBIENT_VARIANTS = [
  'plain',
  'sky-mist',
  'ice-blue',
  'periwinkle',
  'dawn-blue',
] as const;

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

  const [isOpen, setIsOpen] = useState<'suggestions' | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  // При scrollY > 120 активного слайда — возвращаем имя блюда в
  // HomeTopBar.centerLabel. Per-slide state (3 слайда — 3 ячейки): Embla
  // сохраняет scroll-позицию каждого Screen, поэтому возврат на скроллнутый
  // слайд должен сразу показать имя в баре. Активный индекс — из
  // Swipeable.onIndexChange ниже.
  const [activeSlide, setActiveSlide] = useState(DEFAULT_SLIDE);
  const [scrollByIndex, setScrollByIndex] = useState<number[]>(() =>
    Array.from({ length: DISH_SCREENS.length }, () => 0),
  );
  const isScrolled = (scrollByIndex[activeSlide] ?? 0) > 120;
  const makeScrollHandler = useCallback(
    (idx: number) => (y: number) => {
      setScrollByIndex((prev) => {
        if (prev[idx] === y) return prev;
        const next = prev.slice();
        next[idx] = y;
        return next;
      });
    },
    [],
  );
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
  const editFlow = useDishProductFlow({ type: 'edit' });

  const writeFoodTarget = useMemo(
    () => ({ kind: 'dish' as const, dishId: id }),
    [id],
  );
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

  const swipeableRef = useRef<SwipeableRef>(null);

  // НЕ убирать: блокирует свайп между экранами, пока открыта
  // DishSuggestionsModal — иначе свайп уводит из-под модалки.
  useSwipeableLock(isOpen !== null);

  const closeModal = () => setIsOpen(null);

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

  const { anchor: ambientAnchor } = useDesignVariant('ProductAmbient', PRODUCT_AMBIENT_VARIANTS);
  const { anchor: navTileAnchor } = useDesignVariant('NavTileAmbient', NAVTILE_AMBIENT_VARIANTS);

  // Инстансы индикатора держим стабильными (useMemo на стабильном
  // handleSelect) по канону HomePage. Прямого выигрыша от memo(Screen) тут
  // нет — соседние пропы Screen (children/actions/...) инлайн-JSX, memo
  // пробивается всё равно; вреда тоже нет.
  const analysisIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={DISH_SCREENS}
        onSelect={handleSelect}
        slideIndex={0}
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
      />
    ),
    [handleSelect],
  );

  if (!dish) return null;

  const items = dishItems;

  // Hero-имя ПОД тайлами в каждом Screen. `<label>` лежит ВНУТРИ heading-а
  // и оборачивает span — валидный HTML (label принимает phrasing content),
  // и при этом heading рендерится как `<h2>` чтобы у страницы остался один
  // `<h1>` (его роль играет первый Screen). Дублирование heroTop в 3 Screen-ах
  // не плодит h1 в DOM. Клик по label → focus на input ChangeNameModal.
  const heroTop = (
    <Heading size="screen" as="h2">
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

  const getExistingItemsForSuggestions = () =>
    items.map((item) => ({
      productId: item.productId,
      name: item.product?.name ?? '',
      quantity: item.quantity,
    }));

  return (
    <div className={homeStyles.container} {...ambientAnchor}>
      <HomeTopBar
        date={dateForTopBar}
        dateButtonLabel={<CalendarIcon width={22} height={22} />}
        centerLabel={dish.name}
        centerLabelHtmlFor={CHANGE_NAME_INPUT_ID}
        centerLabelVisible={isScrolled}
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
          onIndexChange={(idx) => setActiveSlide(idx)}
        >
          <Screen
            key={1}
            headerOverlap
            heroTop={heroTop}
            stickyTop={analysisIndicator}
            onScrollY={makeScrollHandler(0)}
          >
            <DishAnalysisScreen dishId={id} hasIngredients={items.length > 0} />
          </Screen>

          <Screen
            key={2}
            headerOverlap
            heroTop={heroTop}
            stickyTop={ingredientsIndicator}
            onScrollY={makeScrollHandler(1)}
            hollow={items.length === 0}
            overlay={
              <>
                <DishProductCreateModals dishId={id} />
                <div onFocusCapture={handleEditFocusCapture}>
                  <DishProductEditModals flow={editFlow} />
                </div>
                <DishSuggestionsModal
                  isExpanded={isOpen === 'suggestions'}
                  dishId={id}
                  dishName={dish.name}
                  existingItems={getExistingItemsForSuggestions()}
                  onClose={closeModal}
                />
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
                searchText="Еда"
                writeFoodPlaceholder="Опишите ингредиенты…"
                leadingSlot={
                  <NutrientsSummaryButton totals={dishTotals} onClick={openNutrients} />
                }
              />
            }
          >
            {items.length > 0 && (
              <div className={styles.topLinkRow}>
                <button
                  type="button"
                  className={styles.suggestLink}
                  onClick={() => setIsOpen('suggestions')}
                >
                  Предложить →
                </button>
              </div>
            )}
            <ItemsList offsetTop>
              {items.map((item) => (
                <LongPressRow
                  key={item.id}
                  id={item.id}
                  className={styles.group}
                  innerClassName={styles.dishFoodListItem}
                  onLongPress={() => openActionsDrawer(item)}
                >
                  <span
                    onPointerDown={() => {
                      const trigger = document.getElementById(
                        DISH_EDIT_MODAL_INPUT_IDS.DETAILS_INPUT
                      );
                      if (trigger) trigger.dataset.activeItemId = item.id;
                    }}
                  >
                    <FoodName
                      htmlFor={DISH_EDIT_MODAL_INPUT_IDS.DETAILS_INPUT}
                      onClick={() => {}}
                      content={{ name: item.product?.name ?? item.productId }}
                    />
                  </span>
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
          </Screen>

          <Screen
            key={3}
            headerOverlap
            heroTop={heroTop}
            stickyTop={portionsIndicator}
            onScrollY={makeScrollHandler(2)}
            bottomBar={
              <div className={styles.portionsBar}>
                <button
                  type="button"
                  className={styles.addPortionButton}
                  onClick={() => {
                    const portionsForLabel = portionsRaw.map((p) => ({
                      label: p.label,
                      grams: p.grams,
                    }));
                    void safeMutate(
                      () =>
                        addDishPortion(id, {
                          label: nextDefaultPortionLabel(portionsForLabel),
                          grams: 0,
                        }),
                      'Не удалось добавить порцию',
                    );
                  }}
                >
                  <span className={styles.addPortionPlus} aria-hidden="true">
                    <PlusIcon />
                  </span>
                  Добавить порцию
                </button>
              </div>
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
              showAddButton={false}
              showHint={false}
              onAdd={(p) =>
                void safeMutate(() => addDishPortion(id, p), 'Не удалось добавить порцию')
              }
              onUpdate={(label, updates) => {
                const portion = portionsRaw.find((p) => p.label === label);
                if (portion)
                  void safeMutate(
                    () => updateDishPortion(portion.id, updates),
                    'Не удалось обновить порцию'
                  );
              }}
              onRemove={(label) => {
                const portion = portionsRaw.find((p) => p.label === label);
                if (portion)
                  void safeMutate(() => removeDishPortion(portion.id), 'Не удалось удалить порцию');
              }}
            />
          </Screen>
        </Swipeable>
      </div>
    </div>
  );
};

export default DishBuilderPage;

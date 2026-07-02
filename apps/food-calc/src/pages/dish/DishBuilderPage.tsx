import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { format } from 'date-fns';
import {
  useDish,
  useDishItemsWithProducts,
  useDishPortions,
  updateDishName,
  updateDishItem,
  removeDishItem,
  addDishPortion,
  updateDishPortion,
  removeDishPortion,
  deleteDish,
} from '@/entities/dish';
import { ChangeNameModal, CHANGE_NAME_INPUT_ID } from '@/features/shared/change-name';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { Screen } from '@/shared/ui/Screen';
import {
  useWriteFoodFlow,
  getWriteFoodInputId,
  FoodWriteBar,
} from '@/features/food/food-free-text-parse';
import { SwipeDeck, type DeckSlide } from '@/shared/ui/SwipeDeck';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { CARD_PALETTE_KEY, CARD_PALETTES } from '@/shared/lib/cardPalette';
import { FoodEntryCard } from '@/shared/ui/atoms/FoodEntryCard';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import styles from './DishBuilderPage.module.scss';
import {
  FoodEntryCreateModals,
  FoodEntryEditModals,
  useFoodEntryFlow,
} from '@/features/food/food-entry-flow';
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
import { type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { SuggestActionButton } from '@/shared/ui/SuggestActionButton';
import { drawerStore } from '@/shared/ui/drawer-store';
import { modalStore } from '@/shared/ui/modal-store';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { SuggestIngredientsClarifyDrawer } from '@/features/food/food-free-text-parse/ui/SuggestIngredientsClarifyDrawer';
import { NutrientsDrawer } from '@/widgets/nutrients/NutrientsDrawer';
import { NutrientsBar } from '@/widgets/FoodSchedule/NutrientsBar';

type DishItemWithProduct = {
  id: string;
  productId: string;
  quantity: number;
  details: string;
  product: { name: string | null } | null;
};

// Разделы блюда. Плитки текстовые — tile-art снят (выпилен из проекта).
const DISH_SCREENS: ScreenEntry[] = [
  { label: 'Анализ', titleStyle: 'display-sans' },
  { label: 'Ингредиенты', titleStyle: 'display-sans' },
  { label: 'Порции', titleStyle: 'display-sans' },
];

const DEFAULT_SLIDE = 1;

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
  // ОБЩИЙ контрол палитры карточек (ключ CardPalette): один выбор в DesignBar
  // красит еду, блюдо и события. Раньше ингредиенты были жёстко `dv-palette-lemon`.
  const { anchor: paletteAnchor } = useDesignVariant(CARD_PALETTE_KEY, CARD_PALETTES);
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
  const editFlow = useFoodEntryFlow({ mode: 'edit', target: { kind: 'dish', dishId: id } });
  const createFlow = useFoodEntryFlow({ mode: 'create', target: { kind: 'dish', dishId: id } });
  const editIds = editFlow.inputIds;

  const writeFoodTarget = useMemo(
    () => ({ kind: 'dish' as const, dishId: id }),
    [id],
  );
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

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
      if (target.id !== editIds.DETAILS_INPUT) return;
      const itemId = target.dataset.activeItemId;
      if (!itemId) return;
      const item = itemsRef.current.find((it) => it.id === itemId);
      if (!item) return;
      primeEdit(item);
    },
    [primeEdit, editIds]
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

  // Бар отдаётся в SwipeDeck через render-prop — каркас прокидывает `shellRef`
  // (scroll-hide). На блюде нет даты: пилюля-дата = иконка-календарь, переход к
  // расписанию остаётся; `noInterruptGuard` глушит date-switch confirm.
  const renderTopBar = useCallback(
    (shellRef: React.Ref<HTMLDivElement>) => (
      <HomeTopBar
        date={dateForTopBar}
        backSlot={<BackButton to={backTo} />}
        dateButtonLabel={<CalendarIcon width={22} height={22} />}
        noInterruptGuard
        shellRef={shellRef}
      />
    ),
    [dateForTopBar, backTo],
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
    <Heading role="headline" as="h2">
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

  // Удаление блюда — серая урна в шапке rename-модалки (канон гипотезы). Confirm
  // → cascade-delete (dish_items + portions) → уход на origin: после удаления
  // useDish(id) отдаст undefined и страница вернёт null, поэтому навигируем сами,
  // иначе остался бы пустой экран.
  const handleDeleteDish = async () => {
    const confirmed = await modalStore.show(ConfirmModal, {
      title: 'Удалить блюдо?',
      message: 'Блюдо и его состав будут удалены. Это действие не отменить.',
      confirmLabel: 'Удалить',
      tone: 'danger',
    });
    if (confirmed !== true) return;
    const res = await safeMutate(() => deleteDish(id), 'Не удалось удалить блюдо');
    if (res.ok) {
      setRenameOpen(false);
      navigate(backTo);
    }
  };

  // Semantic suggest: grab the dish name → head A → matched ingredients land in
  // the FoodWriteBar dock (панель предложки над баром, паттерн Событий) — доскролл
  // больше не нужен, панель всегда на виду.
  const handleSuggestIngredients = async () => {
    // Optional «Уточнения» step: undefined = cancelled/swipe-dismissed (don't
    // suggest); any string (incl. '') = proceed, the comment rides into head A.
    const comment = await drawerStore.show(SuggestIngredientsClarifyDrawer, {});
    if (comment === undefined) return;
    writeFoodFlow.submitDishName(dish.name, comment);
  };

  // Каждый слайд = свой `<Screen>`, получающий topSlot (плитки) в `stickyTop`.
  // Каркас (SwipeDeck) владеет container/стеклом/scroll-hide/свайпом/плитками.
  const slides: DeckSlide[] = [
    {
      render: (topSlot) => (
        <Screen
          key={1}
          headerOverlap
          contentHeader={nameHeading}
          stickyTop={topSlot}
          topBarHide="all"
        >
          <DishAnalysisScreen dishId={id} hasIngredients={items.length > 0} />
        </Screen>
      ),
    },
    {
      render: (topSlot) => (
        <Screen
          key={2}
          headerOverlap
          contentHeader={nameHeading}
          stickyTop={topSlot}
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
              <FoodEntryCreateModals flow={createFlow} />
              <div onFocusCapture={handleEditFocusCapture}>
                <FoodEntryEditModals flow={editFlow} />
              </div>
              {/* WriteFoodModals overlay убран 2026-05-23: AutoGrowSearch
                  теперь живёт прямо в FoodWriteBar. Дубликат
                  `<input id={writeFoodInputId}>` в DOM дал бы конфликт. */}
            </>
          }
          bottomBar={
            /* Предложка (InlineWriteFoodReview) живёт ВНУТРИ FoodWriteBar
               (док над баром, паттерн Событий, 2026-07-02) — отдельный
               afterContent-слот больше не нужен (паритет с FoodSchedule). */
            <FoodWriteBar
              flow={writeFoodFlow}
              inputId={writeFoodInputId}
              searchHtmlFor={createFlow.inputIds.SEARCH_INPUT}
              examplesActive={items.length === 0}
            />
          }
        >
          <div {...paletteAnchor} className={styles.dishItemsGroup}>
            <ItemsList>
              {items.map((item, index) => {
                // onPointerDown стэшит activeItemId на DETAILS_INPUT ДО фокуса —
                // его читает handleEditFocusCapture (primeEdit). Тап по имени ИЛИ
                // по деталям открывает редактор деталей (паритет с HomePage).
                const stashDetails = () => {
                  const trigger = document.getElementById(editIds.DETAILS_INPUT);
                  if (trigger) trigger.dataset.activeItemId = item.id;
                };
                return (
                  // Тонкий контейнер: строка dish_item → FoodEntryCard. Времени нет
                  // (dish-ингредиент), qty коммитится в dish_items на blur. dataEntityEdit
                  // НЕ ставим: бар тут не Screen-бар количества.
                  <FoodEntryCard
                    key={item.id}
                    id={item.id}
                    index={index}
                    innerClassName={styles.dishFoodListItem}
                    onLongPress={() => openActionsDrawer(item)}
                    quantity={item.quantity}
                    unit="г"
                    onCommitQuantity={(quantity) =>
                      safeMutate(
                        () => updateDishItem(item.id, { quantity }),
                        'Не удалось обновить количество'
                      )
                    }
                    name={{ name: item.product?.name ?? item.productId }}
                    nameHtmlFor={editIds.DETAILS_INPUT}
                    onNamePointerDown={stashDetails}
                    details={item.details || undefined}
                  />
                );
              })}
            </ItemsList>
          </div>
          {/* Полоса-сводка нутриентов блюда — в конце списка (паритет с
              FoodSchedule). На пустом блюде не показываем. */}
          {items.length > 0 && <NutrientsBar totals={dishTotals} onOpen={openNutrients} />}
        </Screen>
      ),
    },
    {
      render: (topSlot) => (
        <Screen
          key={3}
          headerOverlap
          contentHeader={nameHeading}
          stickyTop={topSlot}
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
      ),
    },
  ];

  return (
    <>
      {/* Rename-модалка: focus-delegation работает через расположение ИНПУТА
          (внутри ChangeNameModal), не лейбла — поэтому модалка живёт соседом
          SwipeDeck. Лейбл в nameHeading (в каждом Screen) редиректит фокус на её
          input по id → onFocusCapture здесь ловит и раскрывает rename. */}
      <div onFocusCapture={handleNameFocusCapture}>
        <ChangeNameModal
          currentName={dish.name}
          isExpanded={renameOpen}
          onClose={() => setRenameOpen(false)}
          onChangeName={(name) => {
            void safeMutate(() => updateDishName(dish.id, name), 'Не удалось переименовать');
            setRenameOpen(false);
          }}
          onDelete={handleDeleteDish}
          deleteLabel="Удалить блюдо"
        />
      </div>
      <SwipeDeck
        screens={DISH_SCREENS}
        slides={slides}
        defaultSlide={DEFAULT_SLIDE}
        renderTopBar={renderTopBar}
      />
    </>
  );
};

export default DishBuilderPage;

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
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
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { Screen } from '@/shared/ui/Screen';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import {
  WriteFoodModals,
  useWriteFoodFlow,
  getWriteFoodInputId,
} from '@/features/food/food-free-text-parse';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import { SelectableListItem } from '@/features/shared/selectable-list-item';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Quantity } from '@/shared/ui/Quantity';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import styles from './DishBuilderPage.module.scss';
import homeStyles from '@/pages/home-page/HomePage.module.scss';
import { ChangeName } from '@/features/shared/change-name';
import { PageHeading } from '@/shared/ui/PageHeading';
import {
  DishProductCreateModals,
  DISH_MODAL_INPUT_IDS,
  DishProductEditModals,
  DISH_EDIT_MODAL_INPUT_IDS,
  DishSuggestionsModal,
  useDishProductFlow,
} from './ui';
import { FoodPortionsManager } from '@/features/food/food-portions-manager';
import { DishAnalysisScreen } from '@/features/dish-analysis';
import { Ornament } from '@/shared/ui/Ornament';
import { useDishNutrientTotals } from '@/entities/dish';
import { TopBar } from '@/shared/ui/TopBar';
import Button from '@/shared/ui/atoms/Button/Button';
import { PasteFromClipboardToDishButton } from '@/features/clipboard';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import {
  ScreenIndicator,
  runTileMigration,
  type ScreenEntry,
} from '@/shared/ui/ScreenIndicator';
import { AppBottomBar, NutrientsSummaryButton } from '@/shared/ui/AppBottomBar';
import { SideDrawer } from '@/shared/ui';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { useNutrientNormSlots } from '@/features/dailyNorms/NutrientNormDrawerControl';
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

  const selectionStore = useSelection();
  const isActionsMode = useStore(selectionStore, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStore, (s) => s.selectedIds);
  const { clearSelection } = selectionStore.getState();

  const [isOpen, setIsOpen] = useState<'suggestions' | null>(null);
  const [nutrientsOpen, setNutrientsOpen] = useState(false);
  const openNutrients = useCallback(() => setNutrientsOpen(true), []);
  const normSlots = useNutrientNormSlots({ isOpen: nutrientsOpen });
  const editFlow = useDishProductFlow({ type: 'edit' });

  const writeFoodTarget = useMemo(
    () => ({ kind: 'dish' as const, dishId: id }),
    [id],
  );
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

  const [activeIndex, setActiveIndex] = useState(DEFAULT_SLIDE);
  const swipeableRef = useRef<SwipeableRef>(null);

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

  const handleIndexChange = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
    setActiveIndex(idx);
  }, []);

  const handleSelectAnimated = useCallback(
    (idx: number) => {
      runTileMigration(activeIndex, idx, () => handleSelect(idx));
    },
    [activeIndex, handleSelect],
  );

  if (!dish) return null;

  const items = dishItems;

  const getSelectedItems = () => items.filter((item) => selectedIds.includes(item.id));

  const onDeleteSelected = async () => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    const results = await Promise.all(
      ids.map((id) => safeMutate(() => removeDishItem(id), 'Не удалось удалить'))
    );
    if (results.some((r) => !r.ok)) return;
    clearSelection();
    toaster.success(`Удалено: ${ids.length}`);
  };

  const onShareSelected = async () => {
    const selected = getSelectedItems();
    if (selected.length === 0) return;

    const payload = selected.map((item) => `${item.productId}:${item.quantity}`).join(',');
    const url = `${window.location.origin}/share?p=${encodeURIComponent(payload)}`;

    try {
      await navigator.clipboard.writeText(url);
      toaster.success('Ссылка скопирована');
      clearSelection();
    } catch {
      toaster.error('Не удалось скопировать ссылку');
    }
  };

  const getExistingItemsForSuggestions = () =>
    items.map((item) => ({
      productId: item.productId,
      name: item.product?.name ?? '',
      quantity: item.quantity,
    }));

  return (
    <div className={homeStyles.container}>
      <HomeTopBar
        date={dateForTopBar}
        dateButtonLabel="К расписанию"
      />
      <div className={homeStyles.swipeArea}>
        <div className={homeStyles.indicatorFloat}>
          <ScreenIndicator
            screens={DISH_SCREENS}
            activeIndex={activeIndex}
            onSelect={handleSelect}
          />
        </div>
        <div className={homeStyles.swipeableLayer}>
          <Swipeable
            ref={swipeableRef}
            defaultSlide={DEFAULT_SLIDE}
            duration={SWIPE_DURATION}
            onIndexChange={handleIndexChange}
            hasDots={false}
          >
            <Screen key={1} headerOverlap>
              <DishAnalysisScreen dishId={id} hasIngredients={items.length > 0} />
            </Screen>

            <Screen
              key={2}
              headerOverlap
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
                  <WriteFoodModals
                    flow={writeFoodFlow}
                    inputId={writeFoodInputId}
                  />
                  <SideDrawer
                    open={nutrientsOpen}
                    onOpenChange={setNutrientsOpen}
                    title={normSlots.title}
                    headerAction={normSlots.headerAction}
                  >
                    {normSlots.bodyContent ?? (
                      <>
                        {normSlots.devToggle}
                        {normSlots.emptyStateBanner}
                        <FoodsNutrients totals={dishTotals} />
                      </>
                    )}
                  </SideDrawer>
                </>
              }
              actions={
                <ActionsPanel
                  show={isActionsMode}
                  onBack={() => clearSelection()}
                  left={<button onClick={onDeleteSelected}>удалить</button>}
                >
                  <button onClick={onShareSelected}>поделиться</button>
                </ActionsPanel>
              }
              bottomBar={
                !isActionsMode ? (
                  <AppBottomBar
                    writeFoodFlow={writeFoodFlow}
                    writeFoodInputId={writeFoodInputId}
                    searchHtmlFor={DISH_MODAL_INPUT_IDS.SEARCH_INPUT}
                    searchLabel="Найти продукт"
                    writeFoodLabel="Опишите ингредиенты…"
                    leadingSlot={
                      <NutrientsSummaryButton totals={dishTotals} onClick={openNutrients} />
                    }
                  />
                ) : null
              }
              topPanel={
                <TopBar>
                  {items.length > 0 && (
                    <Button variant="menu" onClick={() => setIsOpen('suggestions')}>
                      Предложить
                    </Button>
                  )}
                </TopBar>
              }
              header={
                <ChangeName
                  name={dish.name}
                  onChangeName={(val) =>
                    void safeMutate(() => updateDishName(dish.id, val), 'Не удалось переименовать')
                  }
                  heading={
                    <PageHeading
                      title={dish.name}
                      subtitle="блюдо"
                    />
                  }
                />
              }
            >
              <PasteFromClipboardToDishButton dishId={id} wrapperStyle={{ width: '50%' }} />
              <ItemsList offsetTop>
                {items.map((item) => (
                  <SelectableListItem
                    key={item.id}
                    id={item.id}
                    className={styles.group}
                    innerClassName={styles.dishFoodListItem}
                    isSelectMode={isActionsMode}
                    isSelected={selectedIds.includes(item.id)}
                    onSelect={() => selectionStore.getState().toggleSelectedId(item.id)}
                  >
                    <span
                      onPointerDown={() => {
                        const trigger = document.getElementById(DISH_EDIT_MODAL_INPUT_IDS.DETAILS_INPUT);
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
                  </SelectableListItem>
                ))}
              </ItemsList>
            </Screen>

            <Screen key={3} headerOverlap>
              <Ornament text="порции" />
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
        <div className={homeStyles.indicatorClickLayer} aria-hidden>
          {DISH_SCREENS.map((screen, i) => (
            <button
              key={screen.label}
              type="button"
              tabIndex={-1}
              aria-label={screen.label}
              className={homeStyles.indicatorClickTile}
              onClick={() => handleSelectAnimated(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DishBuilderPage;

import React, { memo, useCallback, useEffect, useMemo, useRef, Fragment } from 'react';
import { TimeGroup } from '@/features/time-group';
import styles from './FoodSchedule.module.scss';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { groupItemsByTime } from '@/shared/lib/schedule';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { ScheduleFoodItem } from '@/widgets/FoodSchedule/ScheduleFoodItem';
import { NutrientsBar } from '@/widgets/FoodSchedule/NutrientsBar';
import { Screen, type TopBarHideTarget } from '@/shared/ui/Screen';
import { Heading } from '@/shared/ui/atoms/Typography';
import toaster from '@/shared/lib/toaster/toaster';
import {
  FoodEntryCreateModals,
  FoodEntryEditModals,
  useFoodEntryFlow,
} from '@/features/food/food-entry-flow';
import { AppBottomBar } from '@/shared/ui/AppBottomBar';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { ROW_BOUNDARY_KEY, ROW_BOUNDARY_VARIANTS } from '@/features/shared/long-press-item';
import { removeScheduleFood, useScheduleNutrientTotals } from '@/entities/schedule-food';
import { drawerStore } from '@/shared/ui/drawer-store';
import { NutrientsDrawer } from '@/widgets/nutrients/NutrientsDrawer';
import { ItemActionsDrawer, buildInfoActions } from '@/features/shared/item-actions-drawer';
import { useNavigate } from 'react-router-dom';
import { safeMutate } from '@/shared/lib/safeMutate';

// Cheerful pastel families with semantic time-of-day progression
// (lightest at morning, deepening towards graphite at night).
const FOOD_DV_VARIANTS = [
  'meadow',
  'sunrise',
  'sorbet',
  'garden',
  'lagoon',
  'tropic',
  'twilight',
  // `plain` — neutral grey, identical across every time-of-day step: the
  // list reads as fully colourless (no TOD tint, no period shift).
  'plain',
  // `lime` — the green parallel to Events' `lemon`: ONE pale lime-green
  // (anchored on tropic's green) that barely shifts morning→night.
  'lime',
  // `lemon` — the Events palette applied to food: ONE pale warm-yellow hue
  // that barely shifts morning→night.
  'lemon',
] as const;
import {
  useWriteFoodFlow,
  getWriteFoodInputId,
  InlineWriteFoodReview,
} from '@/features/food/food-free-text-parse';

// HomePage держит свою пилюлю нутриентов (HomeTopBar leadingSlot). FoodSchedule
// дополнительно считает тоталы для полосы-сводки (NutrientsBar) в конце списка —
// тот же useScheduleNutrientTotals, открывает тот же NutrientsDrawer.
type CommonProps = {
  date: string;
  items: ScheduleFoodWithRelations[];
  isActive?: boolean;
  topSlot?: React.ReactNode;
  /** Прокидывается в `Screen` → направление-зависимое скрытие кнопок бара. */
  topBarHide?: TopBarHideTarget;
};

const FoodSchedule = ({
  date,
  items,
  isActive = true,
  topSlot,
  topBarHide,
}: CommonProps) => {
  const navigate = useNavigate();

  const editFlow = useFoodEntryFlow({ mode: 'edit', target: { kind: 'schedule', date } });
  const createFlow = useFoodEntryFlow({ mode: 'create', target: { kind: 'schedule', date } });
  const editIds = editFlow.inputIds;

  const writeFoodTarget = useMemo(() => ({ kind: 'schedule' as const, date }), [date]);
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

  // Design-variant picker for the food list palette (graphite-blue family).
  const { anchor: foodAnchor } = useDesignVariant('ScheduleFood', FOOD_DV_VARIANTS);
  // Second anchor: how adjacent rows meet at their shared edge. Same key as
  // ScheduleEvents so one DesignBar control drives food + event rows together.
  const { anchor: boundaryAnchor } = useDesignVariant(ROW_BOUNDARY_KEY, ROW_BOUNDARY_VARIANTS);

  const startEdit = editFlow.startEdit;
  const onEditTime = useCallback(
    (item: ScheduleFoodWithRelations) => startEdit(item, 'time'),
    [startEdit]
  );
  const onEditFood = useCallback(
    (item: ScheduleFoodWithRelations) => startEdit(item, 'details'),
    [startEdit]
  );
  const onEditQuantity = useCallback(
    (item: ScheduleFoodWithRelations) => startEdit(item, 'quantity'),
    [startEdit]
  );

  // <label htmlFor={DETAILS_EDIT_INPUT}> on each FoodName focuses the
  // already-mounted edit-details textarea directly (so iOS Safari pops the
  // keyboard). The item id to edit is stashed on the textarea's data attribute
  // synchronously on pointerdown; this capture handler reads it and primes
  // editingItem + draft. The flow's own onFocusCapture then flips the step
  // to 'details' from the same focus event.
  const itemsRef = useRef(items);
  // Освежаем ref в эффекте, не в рендере (react-hooks/refs). itemsRef читается
  // только в обработчике фокуса (после рендера) — рассинхрона нет.
  useEffect(() => {
    itemsRef.current = items;
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

  const groups = useMemo(() => groupItemsByTime(items), [items]);
  // Бар плавает над контентом всегда (канон 2026-06-08: Screen.bottomBarOverlay
  // дефолт true, без гейта на пустоте). Полоса-сводка скрыта на пустом списке.
  const isEmpty = items.length === 0;

  // Тоталы дня для полосы-сводки (NutrientsBar) в конце списка. Кнопка полосы
  // открывает тот же NutrientsDrawer слева, что и пилюля HomeTopBar.
  const { totals, missingNutrientNames, isLoading: nutrientsLoading } =
    useScheduleNutrientTotals(date);
  const openNutrients = useCallback(() => {
    void drawerStore.show(
      NutrientsDrawer,
      { totals, missingNutrientNames, isLoading: nutrientsLoading },
      { side: 'left', width: 'min(85vw, 360px)' }
    );
  }, [totals, missingNutrientNames, nutrientsLoading]);

  // Long-press → per-item action drawer: delete (top-right) + «Информация о
  // продукте/блюде» when the row points at a real entity (guarded — orphan
  // rows with no productId/dishId show delete only).
  const openActionsDrawer = useCallback(
    (item: ScheduleFoodWithRelations) => {
      void drawerStore.show(ItemActionsDrawer, {
        title: item.product?.name ?? item.dish?.name ?? 'Еда',
        onDelete: async () => {
          const res = await safeMutate(() => removeScheduleFood(item.id), 'Не удалось удалить');
          if (res.ok) toaster.success('Удалено');
        },
        actions: buildInfoActions(item, navigate),
      });
    },
    [navigate]
  );

  return (
    <Screen
      className={styles.scheduleScreen}
      stickyTop={topSlot}
      headerOverlap
      topBarHide={topBarHide}
      // Шапка слайда «Еда и нутриенты» (Masthead) едет первым ребёнком листа —
      // как «Анализ» на слайде «Открытия» (день уехал в HomeTopBar). Watermark-
      // логотип Disher даёт сам Screen-лист (`.headerOverlap::after`).
      overlay={
        <>
          {isActive ? (
            <>
              <FoodEntryCreateModals flow={createFlow} />
              <div onFocusCapture={handleEditFocusCapture}>
                <FoodEntryEditModals flow={editFlow} />
              </div>
              {/* WriteFoodModals overlay removed: real AutoGrowSearch теперь
                  живёт прямо в AppBottomBar (writeFoodInputLike). Лишний
                  `<input id={writeFoodInputId}>` тут дал бы дубль id'а. */}
            </>
          ) : null}
        </>
      }
      bottomBar={
        <AppBottomBar
          writeFoodFlow={writeFoodFlow}
          writeFoodInputId={writeFoodInputId}
          searchHtmlFor={createFlow.inputIds.SEARCH_INPUT}
          searchLabel="Найти еду"
          searchText="выбрать из списка"
          writeFoodPlaceholder="Напишите, что вы ели или"
          // Переносы регулируются `\n` прямо в строке (CSS white-space: pre-line);
          // без них длинные строки переносит auto-wrap по ширине 80%.
          writeFoodHint={'Например, 9:40 гречка 80, сливочное масло 10,\nяйцо 80, вода 200, хлеб 100, сыр 30'}
        />
      }
      afterContent={
        /* Предложка живёт в afterContent-слоте Screen (2026-06-08): результат
           разбора плавает на фоне страницы ПОД листом со списком, рядом с
           write-баром (chat-pattern). Несёт [data-write-food-anchor] —
           auto-scroll из AppBottomBar.handleSubmit находит её по селектору.
           Loading рисует skeleton-блок со спиннером. */
        <InlineWriteFoodReview flow={writeFoodFlow} />
      }
    >
      <Heading size="masthead" as="h2">Еда и нутриенты</Heading>
      <div {...foodAnchor} className={styles.foodListAnchor}>
        <div {...boundaryAnchor}>
          <ItemsList>
            {(() => {
              let globalIndex = 0;
              const rendered = groups.map((group) => (
                <Fragment key={group.startTime}>
                  <TimeGroup group={group}>
                    {
                      (() => {
                        // Dedup the per-row time: a row whose time matches the row
                        // above renders the label blank (still tappable to edit).
                        // Reset per group so each group's first row always shows.
                        let prevTime: string | null = null;
                        return group.items.map((item) => {
                          const itemIndex = globalIndex++;
                          const dimTime = prevTime === item.time;
                          prevTime = item.time;
                          return (
                          <ScheduleFoodItem
                            key={item.id}
                            item={item}
                            index={itemIndex}
                            dimTime={dimTime}
                            totalCount={items.length}
                            onLongPress={() => openActionsDrawer(item)}
                            onEditTime={onEditTime}
                            onEditFood={onEditFood}
                            onEditQuantity={onEditQuantity}
                            timeHtmlFor={editIds.TIME_INPUT}
                            foodHtmlFor={editIds.DETAILS_INPUT}
                            quantityHtmlFor={editIds.QUANTITY_INPUT}
                          />
                          );
                        });
                      })() as unknown as JSX.Element
                    }
                  </TimeGroup>
                </Fragment>
              ));
              return rendered;
            })()}
          </ItemsList>
        </div>
      </div>
      {/* Полоса-сводка нутриентов — в конце списка, всегда перед предложкой
          (InlineWriteFoodReview живёт в afterContent → рендерится после контента).
          На пустом дне не показываем. */}
      {!isEmpty && <NutrientsBar totals={totals} onOpen={openNutrients} />}
    </Screen>
  );
};

export default memo(FoodSchedule);

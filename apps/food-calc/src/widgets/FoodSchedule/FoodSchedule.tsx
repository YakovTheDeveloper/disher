import React, { memo, useCallback, useEffect, useMemo, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { TimeGroup } from '@/features/time-group';
import styles from './FoodSchedule.module.scss';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { groupItemsByTime } from '@/shared/lib/schedule';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ScheduleFoodItem } from '@/widgets/FoodSchedule/ScheduleFoodItem';
import { NutrientsBar } from '@/widgets/FoodSchedule/NutrientsBar';
import { Screen, type TopBarHideTarget } from '@/shared/ui/Screen';
import toaster from '@/shared/lib/toaster/toaster';
import {
  FoodEntryCreateModals,
  FoodEntryEditModals,
  useFoodEntryFlow,
} from '@/features/food/food-entry-flow';
import { removeScheduleFood, useScheduleNutrientTotals } from '@/entities/schedule-food';
import { drawerStore } from '@/shared/ui/drawer-store';
import { NutrientsDrawer } from '@/widgets/nutrients/NutrientsDrawer';
import {
  ItemActionsDrawer,
  buildInfoActions,
  QuantityIcon,
  NoteIcon,
  ClockIcon,
} from '@/features/shared/item-actions-drawer';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useCardPalette } from '@/shared/lib/cardPalette';
import {
  useWriteFoodFlow,
  getWriteFoodInputId,
  FoodWriteBar,
} from '@/features/food/food-free-text-parse';

// HomePage держит свою пилюлю нутриентов (HomeTopBar leadingSlot). FoodSchedule
// дополнительно считает тоталы для полосы-сводки (NutrientsBar) в конце списка —
// тот же useScheduleNutrientTotals, открывает тот же NutrientsDrawer.
type CommonProps = {
  date: string;
  items: ScheduleFoodWithRelations[];
  isActive?: boolean;
  topSlot?: React.ReactNode;
  /**
   * Заголовок-дата в верхнем слоте `Screen`. Владелец — HomePage (общий на оба
   * экрана дека); FoodSchedule только прокидывает его в `Screen.topContent`.
   */
  topContent?: React.ReactNode;
  /** Прокидывается в `Screen` → направление-зависимое скрытие кнопок бара. */
  topBarHide?: TopBarHideTarget;
};

const FoodSchedule = ({
  date,
  items,
  isActive = true,
  topSlot,
  topContent,
  topBarHide,
}: CommonProps) => {
  const { t } = useTranslation();
  const editFlow = useFoodEntryFlow({ mode: 'edit', target: { kind: 'schedule', date } });
  const createFlow = useFoodEntryFlow({ mode: 'create', target: { kind: 'schedule', date } });
  const editIds = editFlow.inputIds;

  const writeFoodTarget = useMemo(() => ({ kind: 'schedule' as const, date }), [date]);
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

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
      const { QUANTITY_INPUT, DETAILS_INPUT, TIME_INPUT } = editIds;
      if (
        target.id !== QUANTITY_INPUT &&
        target.id !== DETAILS_INPUT &&
        target.id !== TIME_INPUT
      ) {
        return;
      }
      // Медаль ItemActionsDrawer только что делегировала фокус сюда — дровер
      // отработал, закрываем его (открыт с trapFocus:false, поэтому фокус смог
      // уйти наружу портала). No-op, когда дровера нет (правка из тапа по имени
      // ряда), — closeLast закрывает лишь открытый инстанс.
      drawerStore.closeLast();
      if (target.id === DETAILS_INPUT) {
        const itemId = target.dataset.activeItemId;
        if (!itemId) return;
        const item = itemsRef.current.find((it) => it.id === itemId);
        if (!item) return;
        primeEdit(item);
      }
    },
    [primeEdit, editIds]
  );

  const groups = useMemo(() => groupItemsByTime(items), [items]);

  // Палитра карточек «еды расписания» — постоянный выбор из настроек (ProfileDrawer
  // → «Цвет карточек»), пер-поверхностный. Дефолт amber. Раньше был общий контрол
  // в dev-DesignBar; ещё раньше еда была жёстко `dv-palette-lemon`.
  const palette = useCardPalette('scheduleFood');
  // Бар плавает над контентом всегда (канон 2026-06-08: Screen.bottomBarOverlay
  // дефолт true, без гейта на пустоте). Полоса-сводка скрыта на пустом списке.
  const isEmpty = items.length === 0;

  // Тоталы дня для полосы-сводки (NutrientsBar) в конце списка. Кнопка полосы
  // открывает тот же NutrientsDrawer слева, что и пилюля HomeTopBar.
  const {
    totals,
    missingNutrientNames,
    isLoading: nutrientsLoading,
  } = useScheduleNutrientTotals(date);
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
      void drawerStore.show(
        ItemActionsDrawer,
        {
        title: item.product?.name ?? item.dish?.name ?? 'Еда',
        onDelete: async () => {
          const res = await safeMutate(() => removeScheduleFood(item.id), 'Не удалось удалить');
          if (res.ok) toaster.success('Удалено');
        },
        actions: buildInfoActions(item),
        // Ряд правок под «Информация…» = три голые медали (WriteBarMedal): дуговая
        // подпись + иконка по центру. Каждая — `<label htmlFor>` на свой edit-input.
        // Тап делегирует фокус → onFocusCapture FoodEntryEditModals флипает шаг и iOS
        // поднимает клавиатуру (императивный startEdit её не поднимал); handleEdit-
        // FocusCapture закрывает этот дровер. onClick только праймит (primeEdit ставит
        // editingItem + draft, БЕЗ setStep — шаг ставит focus-событие; синхронный
        // setStep/close размонтировал бы label до делегирования). Подпись = arcTop
        // (строчными на дуге). Ряд только у расписания — у ингредиента блюда «Время» нет.
        editActions: [
          {
            label: 'количество',
            icon: <QuantityIcon />,
            htmlFor: editIds.QUANTITY_INPUT,
            onClick: () => primeEdit(item),
          },
          {
            label: 'уточнения',
            icon: <NoteIcon />,
            htmlFor: editIds.DETAILS_INPUT,
            onClick: () => primeEdit(item),
          },
          {
            label: 'время',
            icon: <ClockIcon />,
            htmlFor: editIds.TIME_INPUT,
            onClick: () => primeEdit(item),
          },
        ],
        },
        // trapFocus:false — иначе focus-trap дровера завернул бы делегацию медали
        // назад, и фокус не дошёл бы до edit-инпута (он вне портала дровера).
        { trapFocus: false }
      );
    },
    [primeEdit, editIds]
  );

  return (
    <Screen
      stickyTop={topSlot}
      headerOverlap
      topBarHide={topBarHide}
      // Дата дня — в нейтральный верхний слот Screen `topContent`. Сам элемент
      // строит и владеет им HomePage (общий на оба экрана дека, 2026-07-04);
      // FoodSchedule только прокидывает. Полка листа несёт только хват-пилюлю.
      topContent={topContent}
      overlay={
        <>
          {isActive ? (
            <>
              <FoodEntryCreateModals flow={createFlow} />
              <div onFocusCapture={handleEditFocusCapture}>
                <FoodEntryEditModals flow={editFlow} />
              </div>
              {/* WriteFoodModals overlay removed: real AutoGrowSearch теперь
                  живёт прямо в FoodWriteBar. Лишний `<input id={writeFoodInputId}>`
                  тут дал бы дубль id'а. */}
            </>
          ) : null}
        </>
      }
      bottomBar={
        /* Предложка (InlineWriteFoodReview) теперь живёт ВНУТРИ FoodWriteBar
           (док над баром, по паттерну Событий, 2026-07-02) — отдельный
           afterContent-слот больше не нужен. */
        <FoodWriteBar
          flow={writeFoodFlow}
          inputId={writeFoodInputId}
          searchHtmlFor={createFlow.inputIds.SEARCH_INPUT}
          examplesActive={isEmpty}
        />
      }
    >
      <div data-dv-v={palette} className={styles.foodListAnchor}>
        {isEmpty ? (
          <EmptyState
            className={styles.empty}
            title={t('schedule.empty.food.title')}
            description={t('schedule.empty.food.description')}
          />
        ) : (
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
        )}
      </div>
      {/* Полоса-сводка нутриентов — в конце списка. На пустом дне не показываем. */}
      {!isEmpty && <NutrientsBar totals={totals} onOpen={openNutrients} />}
    </Screen>
  );
};

export default memo(FoodSchedule);

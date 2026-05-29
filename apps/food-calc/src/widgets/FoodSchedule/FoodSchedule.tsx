import React, { memo, useCallback, useMemo, useRef, Fragment } from 'react';
import { TimeGroup } from '@/features/time-group';
import styles from './FoodSchedule.module.scss';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { groupItemsByTime } from '@/shared/lib/schedule';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { ScheduleFoodItem } from '@/widgets/FoodSchedule/ScheduleFoodItem';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import { Screen } from '@/shared/ui/Screen';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import toaster from '@/shared/lib/toaster/toaster';
import {
  ScheduleFoodCreateModals,
  ScheduleFoodEditModals,
  SCHEDULE_FOOD_INPUT_IDS,
  useScheduleFoodFlow,
} from '@/widgets/FoodSchedule/ui';
import { AppBottomBar } from '@/shared/ui/AppBottomBar';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { IconButton } from '@/shared/ui/atoms/Button/IconButton';
import { removeScheduleFoods } from '@/entities/schedule-food';
import { drawerStore } from '@/shared/ui/drawer-store';
import { DeleteConfirmationModal } from '@/widgets/FoodSchedule/ui/drawers';
import { CopyToClipboardButton, PasteFromClipboardButton } from '@/features/clipboard';
import type { ClipboardItem } from '@/shared/model/clipboardStore';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { formatWeekdayTitle } from '@/shared/lib/time/formatWeekday';

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
] as const;
import {
  useWriteFoodFlow,
  getWriteFoodInputId,
  InlineWriteFoodReview,
} from '@/features/food/food-free-text-parse';

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// `totals` / `missingNutrientNames` / `isLoading` уехали в HomePage — там же
// открывается NutrientsDrawer из HomeTopBar центральной pill (эксперимент
// 2026-05-21). FoodSchedule больше не владеет агрегатами нутриентов.
type CommonProps = {
  date: string;
  items: ScheduleFoodWithRelations[];
  richNutrient?: { id: string; unit: string } | null;
  onRichNutrientClear?: () => void;
  isActive?: boolean;
  topSlot?: React.ReactNode;
};

const FoodSchedule = ({
  date,
  items,
  richNutrient,
  onRichNutrientClear,
  isActive = true,
  topSlot,
}: CommonProps) => {
  const selectionStoreFood = useSelection();
  const isActionsMode = useStore(selectionStoreFood, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStoreFood, (s) => s.selectedIds);
  const { clearSelection, setSelectedIds } = selectionStoreFood.getState();

  const editFlow = useScheduleFoodFlow({ type: 'edit' });

  const writeFoodTarget = useMemo(() => ({ kind: 'schedule' as const, date }), [date]);
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

  // Design-variant picker for the food list palette (graphite-blue family).
  const { anchor: foodAnchor } = useDesignVariant('ScheduleFood', FOOD_DV_VARIANTS);

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
  itemsRef.current = items;
  const primeEdit = editFlow.primeEdit;
  const handleEditFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.id !== SCHEDULE_FOOD_INPUT_IDS.DETAILS_EDIT_INPUT) return;
      const itemId = target.dataset.activeItemId;
      if (!itemId) return;
      const item = itemsRef.current.find((it) => it.id === itemId);
      if (!item) return;
      primeEdit(item);
    },
    [primeEdit]
  );

  const groups = useMemo(() => groupItemsByTime(items), [items]);
  const weekdayTitle = useMemo(() => formatWeekdayTitle(date), [date]);

  const setSelectedIdsRef = useRef(setSelectedIds);
  setSelectedIdsRef.current = setSelectedIds;
  const onTimeClick = useCallback((group: { items: Array<{ id: string }> }) => {
    setSelectedIdsRef.current(group.items.map((i) => i.id));
  }, []);

  const onDeleteSelected = async () => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    const confirmed = await drawerStore.show(DeleteConfirmationModal, { count: ids.length });
    if (!confirmed) return;
    await removeScheduleFoods(ids);
    clearSelection();
    toaster.success(`Удалено: ${ids.length}`);
  };

  const selectedItemsForClipboard: ClipboardItem[] = useMemo(
    () =>
      items
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => ({
          time: item.time,
          type: item.type as 'food' | 'dish',
          quantity: item.quantity,
          details: item.details ?? null,
          productId: item.productId ?? null,
          dishId: item.dishId ?? null,
          displayName: item.product?.name ?? item.dish?.name ?? '—',
        })),
    [items, selectedIds]
  );

  return (
    <Screen
      className={styles.scheduleScreen}
      stickyTop={topSlot}
      headerOverlap
      overlay={
        <>
          {isActive ? (
            <>
              <ScheduleFoodCreateModals
                scheduleId={date}
                richNutrient={richNutrient}
                onRichNutrientClear={onRichNutrientClear}
              />
              <div onFocusCapture={handleEditFocusCapture}>
                <ScheduleFoodEditModals flow={editFlow} />
              </div>
              {/* WriteFoodModals overlay removed: real AutoGrowSearch теперь
                  живёт прямо в AppBottomBar (writeFoodInputLike). Лишний
                  `<input id={writeFoodInputId}>` тут дал бы дубль id'а. */}
            </>
          ) : null}
        </>
      }
      actions={
        <ActionsPanel
          show={isActionsMode}
          onBack={clearSelection}
          left={
            <IconButton icon={<TrashIcon />} onClick={onDeleteSelected}>
              Удалить
            </IconButton>
          }
        >
          <CopyToClipboardButton
            items={selectedItemsForClipboard}
            sourceDate={date}
            selectedCount={selectedIds.length}
            onCopied={clearSelection}
          />
        </ActionsPanel>
      }
      bottomBar={
        !isActionsMode ? (
          <AppBottomBar
            writeFoodFlow={writeFoodFlow}
            writeFoodInputId={writeFoodInputId}
            searchHtmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT}
            searchLabel="Найти еду"
            searchText="Еда"
            writeFoodPlaceholder="Введите, что вы ели и когда"
          />
        ) : null
      }
    >
      <div className={styles.weekdayHeading}>
        <Heading size="section">{weekdayTitle}</Heading>
      </div>
      <PasteFromClipboardButton targetDate={date} wrapperStyle={{ width: '50%' }} />
      <div {...foodAnchor} className={styles.foodListAnchor}>
        <ItemsList>
          {(() => {
            let globalIndex = 0;
            const rendered = groups.map((group) => (
              <Fragment key={group.startTime}>
                <TimeGroup group={group} onTimeClick={onTimeClick}>
                  {
                    group.items.map((item) => {
                      const itemIndex = globalIndex++;
                      return (
                        <ScheduleFoodItem
                          key={item.id}
                          item={item}
                          index={itemIndex}
                          totalCount={items.length}
                          selectionStore={selectionStoreFood}
                          onEditTime={onEditTime}
                          onEditFood={onEditFood}
                          onEditQuantity={onEditQuantity}
                          timeHtmlFor={SCHEDULE_FOOD_INPUT_IDS.TIME_EDIT_INPUT}
                          foodHtmlFor={SCHEDULE_FOOD_INPUT_IDS.DETAILS_EDIT_INPUT}
                          quantityHtmlFor={SCHEDULE_FOOD_INPUT_IDS.QUANTITY_EDIT_INPUT}
                        />
                      );
                    }) as unknown as JSX.Element
                  }
                </TimeGroup>
              </Fragment>
            ));
            return rendered;
          })()}
        </ItemsList>
      </div>
      {/* Предложка переехала ПОД список (2026-05-23): chat-pattern — место
          результата рядом с местом ввода (bottom-bar). Во время loading
          рендерится skeleton-блок со спиннером; auto-scroll триггерится из
          AppBottomBar.handleSubmit (привязан к user-action). */}
      <InlineWriteFoodReview flow={writeFoodFlow} />
    </Screen>
  );
};

export default memo(FoodSchedule);

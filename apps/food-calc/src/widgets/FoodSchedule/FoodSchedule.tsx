import React, { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { TimeGroup } from '@/features/time-group';
import styles from './FoodSchedule.module.scss';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { groupItemsByTime, getNowMarkerIndex } from '@/shared/lib/schedule';
import { NowMarker } from '@/shared/ui/NowMarker';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { ScheduleFoodItem } from '@/widgets/FoodSchedule/ScheduleFoodItem';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import { Screen } from '@/shared/ui/Screen';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import toaster from '@/shared/lib/toaster/toaster';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import {
  ScheduleFoodCreateModals,
  ScheduleFoodEditModals,
  SCHEDULE_FOOD_INPUT_IDS,
  useScheduleFoodFlow,
  HomeBottomBar,
} from '@/widgets/FoodSchedule/ui';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { IconButton } from '@/shared/ui/atoms/Button/IconButton';
import { removeScheduleFoods } from '@/entities/schedule-food';
import { drawerStore } from '@/shared/ui/drawer-store';
import { DeleteConfirmationModal } from '@/widgets/FoodSchedule/ui/drawers';
import { CopyToClipboardButton, PasteFromClipboardButton } from '@/features/clipboard';
import type { ClipboardItem } from '@/shared/model/clipboardStore';

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
import { fetchDailyAnalysis, computeInputHash } from '@/entities/analytics';
import { createProduct } from '@/entities/product';
import { createDish } from '@/entities/dish';
import { safeMutate } from '@/shared/lib/safeMutate';
import { getProductUrl, RouterUrls } from '@/app/router';
import CreateFoodPanel from './ui/CreateFoodPanel';
import {
  WriteFoodModals,
  useWriteFoodFlow,
  getWriteFoodInputId,
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

type CommonProps = {
  date: string;
  items: ScheduleFoodWithRelations[];
  richNutrient?: { id: string; unit: string } | null;
  onRichNutrientClear?: () => void;
  isActive?: boolean;
  /** Provided by HomePage so all three slides share one variant index. */
  bottomBarVariantIndex?: number;
};

const FoodSchedule = ({
  date,
  items,
  richNutrient,
  onRichNutrientClear,
  isActive = true,
  bottomBarVariantIndex = 0,
}: CommonProps) => {
  const selectionStoreFood = useSelection();
  const isActionsMode = useStore(selectionStoreFood, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStoreFood, (s) => s.selectedIds);
  const { clearSelection, setSelectedIds } = selectionStoreFood.getState();

  const { toScheduleAnalytics } = useAppRoutes();

  const editFlow = useScheduleFoodFlow({ type: 'edit' });
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  // Hide bottom action bar while user is editing time/quantity inline on
  // a schedule-food row — otherwise the bar covers the row being edited.
  const [inlineEditing, setInlineEditing] = useState(false);
  useEffect(() => {
    const isInsideRow = (el: Element | null) =>
      !!(el as HTMLElement | null)?.closest('[data-schedule-food-id] input');
    const onFocusIn = (e: FocusEvent) => {
      if (isInsideRow(e.target as Element)) setInlineEditing(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isInsideRow(e.target as Element)) return;
      const next = e.relatedTarget as Element | null;
      if (isInsideRow(next)) return;
      setInlineEditing(false);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const writeFoodTarget = useMemo(() => ({ kind: 'schedule' as const, date }), [date]);
  const writeFoodFlow = useWriteFoodFlow(writeFoodTarget);
  const writeFoodInputId = getWriteFoodInputId(writeFoodTarget);

  // Design-variant picker for the food list palette (graphite-blue family).
  const { anchor: foodAnchor } = useDesignVariant('ScheduleFood', FOOD_DV_VARIANTS);

  // Analytics staleness indicator: 'none' | 'fresh' | 'stale'
  const [analyticsStatus, setAnalyticsStatus] = useState<'none' | 'fresh' | 'stale'>('none');
  useEffect(() => {
    let cancelled = false;
    if (items.length === 0) {
      setAnalyticsStatus('none');
      return;
    }

    (async () => {
      const persisted = await fetchDailyAnalysis(date, 'food');
      if (cancelled) return;
      if (!persisted) {
        setAnalyticsStatus('none');
        return;
      }

      const snap = items.map((sf) => ({
        time: sf.time,
        name: sf.product?.name || sf.dish?.name || '',
        quantity: sf.quantity,
        type: sf.type,
      }));
      const currentHash = await computeInputHash(snap);
      if (cancelled) return;
      setAnalyticsStatus(currentHash === persisted.inputHash ? 'fresh' : 'stale');
    })();

    return () => {
      cancelled = true;
    };
  }, [date, items]);

  const openCreateFoodPanel = useCallback(() => {
    setShowCreatePanel((v) => !v);
  }, []);

  const handleCreateProduct = useCallback(async () => {
    const name = 'Новый продукт';
    const result = await safeMutate(() => createProduct({ name }), 'Не удалось создать продукт');
    if (!result.ok) return;
    setShowCreatePanel(false);
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: getProductUrl(result.value) },
    });
  }, []);

  const handleCreateDish = useCallback(async () => {
    const name = 'Новое блюдо';
    const result = await safeMutate(() => createDish(name), 'Не удалось создать блюдо');
    if (!result.ok) return;
    setShowCreatePanel(false);
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(result.value) },
    });
  }, []);

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
  const nowMarkerIndex = useMemo(() => getNowMarkerIndex(groups, date), [groups, date]);

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

  const handleOpenAnalysis = useCallback(() => {
    setShowCreatePanel(false);
    toScheduleAnalytics(date);
  }, [toScheduleAnalytics, date]);

  return (
    <Screen
      headerOverlap
      overlay={
        isActive ? (
          <>
            <ScheduleFoodCreateModals
              scheduleId={date}
              richNutrient={richNutrient}
              onRichNutrientClear={onRichNutrientClear}
            />
            <div onFocusCapture={handleEditFocusCapture}>
              <ScheduleFoodEditModals flow={editFlow} />
            </div>
            <WriteFoodModals flow={writeFoodFlow} inputId={writeFoodInputId} />
          </>
        ) : null
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
          <HomeBottomBar
            variantIndex={bottomBarVariantIndex}
            writeFoodFlow={writeFoodFlow}
            writeFoodInputId={writeFoodInputId}
            onPlusClick={openCreateFoodPanel}
            hidden={inlineEditing}
          />
        ) : null
      }
    >
      {showCreatePanel && (
        <CreateFoodPanel
          onCreateProduct={handleCreateProduct}
          onCreateDish={handleCreateDish}
          onOpenAnalysis={items.length > 0 ? handleOpenAnalysis : undefined}
          analysisStatus={analyticsStatus}
        />
      )}
      <PasteFromClipboardButton targetDate={date} wrapperStyle={{ width: '50%' }} />
      <div {...foodAnchor} className={styles.foodListAnchor}>
      <ItemsList offsetTop>
        {(() => {
          let globalIndex = 0;
          const rendered = groups.map((group, idx) => (
            <Fragment key={group.time}>
              {nowMarkerIndex === idx && <NowMarker />}
              <TimeGroup
                group={group}
                isFuture={nowMarkerIndex >= 0 && idx >= nowMarkerIndex}
                onTimeClick={onTimeClick}
              >
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
              {nowMarkerIndex === groups.length && idx === groups.length - 1 && <NowMarker />}
            </Fragment>
          ));
          return rendered;
        })()}
      </ItemsList>
      </div>
    </Screen>
  );
};

export default FoodSchedule;

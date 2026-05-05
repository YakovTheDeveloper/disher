import React, { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import clsx from 'clsx';
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
import { Navigation } from '@/pages/home-page/ui';
import toaster from '@/shared/lib/toaster/toaster';
import { useUiStore } from '@/shared/model/uiStore';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { TopBar } from '@/shared/ui/TopBar';
import Button from '@/shared/ui/atoms/Button/Button';
import {
  ScheduleFoodCreateModals,
  ScheduleFoodEditModals,
  SCHEDULE_FOOD_INPUT_IDS,
  useScheduleFoodFlow,
} from '@/widgets/FoodSchedule/ui';
import { IconButton } from '@/shared/ui/atoms/Button/IconButton';
import { removeScheduleFoods } from '@/entities/schedule-food';
import { drawerStore } from '@/shared/ui/drawer-store';
import { DeleteConfirmationModal } from '@/widgets/FoodSchedule/ui/drawers';
import { CopyToClipboardButton, PasteFromClipboardButton } from '@/features/clipboard';
import type { ClipboardItem } from '@/shared/model/clipboardStore';
import { AccountPanel } from '@/features/auth';
import { PeriodView } from '@/features/ScheduleSelection/SchedulePeriods';
import { openSchedulePeriodsModal } from './ui';
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
import { AddFoodActionBar } from '@/features/food/food-add-action-bar';

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
};

const FoodSchedule = ({
  date,
  items,
  richNutrient,
  onRichNutrientClear,
  isActive = true,
}: CommonProps) => {
  const selectionStoreFood = useSelection();
  const isActionsMode = useStore(selectionStoreFood, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStoreFood, (s) => s.selectedIds);
  const { clearSelection, setSelectedIds } = selectionStoreFood.getState();

  const showPrice = useUiStore((s) => s.scheduleFoodsShowPrice);
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
    const productId = await safeMutate(() => createProduct({ name }), 'Не удалось создать продукт');
    if (productId === undefined) return;
    setShowCreatePanel(false);
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: getProductUrl(productId) },
    });
  }, []);

  const handleCreateDish = useCallback(async () => {
    const name = 'Новое блюдо';
    const dishId = await safeMutate(() => createDish(name), 'Не удалось создать блюдо');
    if (dishId === undefined) return;
    setShowCreatePanel(false);
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
  }, []);

  const startEdit = editFlow.startEdit;
  const onEditTime = useCallback(
    (item: ScheduleFoodWithRelations) => startEdit(item, 'time'),
    [startEdit]
  );
  const onEditFood = useCallback(
    (item: ScheduleFoodWithRelations) => startEdit(item, 'search'),
    [startEdit]
  );
  const onEditQuantity = useCallback(
    (item: ScheduleFoodWithRelations) => startEdit(item, 'quantity'),
    [startEdit]
  );

  // <label htmlFor={SEARCH_EDIT_INPUT}> on each FoodName focuses the
  // already-mounted edit-search input directly (so iOS Safari pops the
  // keyboard). The item id to edit is stashed on the input's data attribute
  // synchronously on pointerdown; this capture handler reads it and primes
  // editingItem + draft. The flow's own onFocusCapture then flips the step
  // to 'search' from the same focus event.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const primeEdit = editFlow.primeEdit;
  const handleEditFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.id !== SCHEDULE_FOOD_INPUT_IDS.SEARCH_EDIT_INPUT) return;
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

  return (
    <Screen
      offsetTop={
        showCreatePanel ? (
          <CreateFoodPanel onCreateProduct={handleCreateProduct} onCreateDish={handleCreateDish} />
        ) : (
          true
        )
      }
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
      topPanel={
        <TopBar>
          {items.length > 0 && (
            <>
              <Button variant="menu" onClick={openCreateFoodPanel}>
                Создать еду
              </Button>
              <Button variant="menu" onClick={() => toScheduleAnalytics(date)}>
                Анализ
                {analyticsStatus !== 'none' && (
                  <span
                    className={clsx(styles.analyticsDot, styles[`analyticsDot_${analyticsStatus}`])}
                  />
                )}
              </Button>
            </>
          )}
          <AccountPanel />
        </TopBar>
      }
      bottomLeft={
        !isActionsMode ? (
          <div
            className={clsx(
              styles.actionBarWrapper,
              inlineEditing && styles.actionBarWrapper_hidden
            )}
          >
            <AddFoodActionBar
              writeFoodFlow={writeFoodFlow}
              writeFoodInputId={writeFoodInputId}
              searchHtmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT}
            />
          </div>
        ) : null
      }
    >
      {/* <PeriodView onOpen={() => openSchedulePeriodsModal(date)} /> */}
      <div className={styles.navRow}>
        <PasteFromClipboardButton targetDate={date} wrapperStyle={{ width: '50%' }} />
        <Navigation />
      </div>
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
                        showPrice={showPrice}
                        onEditTime={onEditTime}
                        onEditFood={onEditFood}
                        onEditQuantity={onEditQuantity}
                        timeHtmlFor={SCHEDULE_FOOD_INPUT_IDS.TIME_EDIT_INPUT}
                        foodHtmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_EDIT_INPUT}
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
    </Screen>
  );
};

export default FoodSchedule;

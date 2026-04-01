import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TimeGroup } from '@/features/time-group';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { groupItemsByTime, getNowMarkerIndex } from '@/shared/lib/schedule';
import { NowMarker } from '@/shared/ui/NowMarker';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import ScheduleFoodItemComponent from '@/widgets/FoodSchedule/ScheduleFoodItem/ScheduleFoodItem';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import { useStore as useLiveStore } from '@livestore/react';
import { Screen } from '@/shared/ui/Screen';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import { Navigation } from '@/pages/home-page/ui';
import toaster from '@/shared/lib/toaster/toaster';
import { useUiStore } from '@/shared/model/uiStore';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import AddButton from '@/shared/ui/atoms/Button/AddButton/AddButton';
import { TopBar } from '@/shared/ui/TopBar';
import Button from '@/shared/ui/atoms/Button/Button';
import {
  ScheduleFoodCreateModals,
  ScheduleFoodEditModals,
  SCHEDULE_FOOD_INPUT_IDS,
} from '@/widgets/FoodSchedule/ui';
import { IconButton } from '@/shared/ui/atoms/Button/IconButton';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { removeScheduleFoods } from '@/entities/schedule-food';
import { drawerStore } from '@/shared/ui/drawer-store';
import { DeleteConfirmationModal } from '@/widgets/FoodSchedule/ui/drawers';
import { CopyToClipboardButton, PasteFromClipboardButton } from '@/features/clipboard';
import type { ClipboardItem } from '@/shared/model/clipboardStore';
import { AccountPanel } from '@/features/auth';
import { PeriodBanner } from '@/features/ScheduleSelection/SchedulePeriods';
import { fetchDailyAnalysis, computeInputHash } from '@/entities/analytics';

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
  const { store } = useLiveStore();
  const selectionStoreFood = useSelection();
  const isActionsMode = useStore(selectionStoreFood, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStoreFood, (s) => s.selectedIds);
  const { clearSelection, setSelectedIds } = selectionStoreFood.getState();

  const showPrice = useUiStore((s) => s.scheduleFoodsShowPrice);
  const toggleShowPrice = useUiStore((s) => s.toggleScheduleFoodsShowPrice);
  const { toScheduleAnalytics } = useAppRoutes();

  const [editingItem, setEditingItem] = useState<ScheduleFoodWithRelations | null>(null);
  const [editingStep, setEditingStep] = useState<'idle' | 'time' | 'search' | 'quantity'>('idle');

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

  useSwipeableLock(editingItem !== null);

  const closeEditModal = () => {
    setEditingItem(null);
    setEditingStep('idle');
  };

  const openEditModal = (item: ScheduleFoodWithRelations, step: 'time' | 'search' | 'quantity') => {
    setEditingItem(item);
    setEditingStep(step);
  };

  const onEditTime = useCallback(
    (item: ScheduleFoodWithRelations) => openEditModal(item, 'time'),
    []
  );
  const onEditFood = useCallback(
    (item: ScheduleFoodWithRelations) => openEditModal(item, 'search'),
    []
  );
  const onEditQuantity = useCallback(
    (item: ScheduleFoodWithRelations) => openEditModal(item, 'quantity'),
    []
  );

  const groups = useMemo(() => groupItemsByTime(items), [items]);
  const nowMarkerIndex = useMemo(() => getNowMarkerIndex(groups, date), [groups, date]);

  const onDeleteSelected = async () => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    const confirmed = await drawerStore.show(DeleteConfirmationModal, { count: ids.length });
    if (!confirmed) return;
    removeScheduleFoods(store, ids);
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
      offsetTop
      overlay={
        isActive ? (
          <>
            <ScheduleFoodCreateModals
              scheduleId={date}
              richNutrient={richNutrient}
              onRichNutrientClear={onRichNutrientClear}
            />
            {editingItem && (
              <ScheduleFoodEditModals
                item={editingItem}
                initialStep={editingStep}
                onClose={closeEditModal}
              />
            )}
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
              <Button variant="menu" onClick={() => toScheduleAnalytics(date)}>
                Анализ
                {analyticsStatus !== 'none' && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      marginLeft: 4,
                      verticalAlign: 'middle',
                      background: analyticsStatus === 'fresh' ? '#22c55e' : '#f59e0b',
                    }}
                  />
                )}
              </Button>
            </>
          )}
          <AccountPanel />
        </TopBar>
      }
      bottomRight={
        isActionsMode || items.length === 0 ? null : (
          <AddButton onClick={() => {}} as="label" htmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT} />
        )
      }
    >
      <PeriodBanner date={date} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <PasteFromClipboardButton targetDate={date} wrapperStyle={{ width: '50%' }} />
        <Navigation />
      </div>
      {items.length === 0 && (
        <div style={{ padding: `var(--space-10) var(--space-4) 0` }}>
          <AddButton
            onClick={() => {}}
            as="label"
            htmlFor={SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT}
            prominent
          >
            Добавить еду в этот день
          </AddButton>
        </div>
      )}
      <ItemsList offsetTop>
        {(() => {
          let globalIndex = 0;
          return groups.map((group, idx) => (
            <React.Fragment key={group.time}>
              {nowMarkerIndex === idx && <NowMarker />}
              <TimeGroup
                group={group}
                isFuture={nowMarkerIndex >= 0 && idx >= nowMarkerIndex}
                onTimeClick={(group) => setSelectedIds(group.items.map((i: any) => i.id))}
              >
                {
                  group.items.map((item) => {
                    const itemIndex = globalIndex++;
                    return (
                      <ScheduleFoodItemComponent
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
            </React.Fragment>
          ));
        })()}
      </ItemsList>
    </Screen>
  );
};

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

export default FoodSchedule;

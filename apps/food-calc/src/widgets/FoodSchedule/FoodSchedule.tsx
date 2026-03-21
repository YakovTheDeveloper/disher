import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TimeGroup } from '@/features/time-group';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food';
import { groupItemsByTime } from '@/shared/lib/schedule';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import ScheduleFoodItemComponent from '@/widgets/FoodSchedule/ScheduleFoodItem/ScheduleFoodItem';
import { useSelection, useStore } from '@/hooks/factoryHooks/useSelection';
import { Screen } from '@/shared/ui/Screen';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import { Navigation } from '@/pages/home-page/ui';
import Typography from '@/shared/ui/atoms/Typography/Typography';
import toaster from '@/shared/lib/toaster/toaster';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import Button from '@/shared/ui/atoms/Button/Button';
import { useUiStore } from '@/shared/model/uiStore';
import AddButton from '@/shared/ui/atoms/Button/AddButton/AddButton';
import {
  ScheduleFoodCreationModals,
  MODAL_INPUT_IDS,
  CopyToNewDishModal,
  CopyToExistingDishModal,
  CopyToAnotherDayScheduleModal,
  EditScheduleFoodModal,
  EDIT_MODAL_INPUT_IDS,
} from '@/widgets/FoodSchedule/ui';
import { CountBadge } from '@/shared/ui/atoms/Button/CountBadge/CountBadge';
import { IconButton } from '@/shared/ui/atoms/Button/IconButton';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { removeScheduleFoods } from '@/entities/schedule-food';
import { drawerStore } from '@/shared/ui/drawer-store';
import { DeleteConfirmationModal } from '@/widgets/FoodSchedule/ui/drawers';

type CommonProps = {
  date: string;
  items: ScheduleFoodWithRelations[];
};

const FoodSchedule = ({ date, items }: CommonProps) => {
  const { toScheduleAnalytics, toFood } = useAppRoutes();
  const selectionStoreFood = useSelection();
  const isActionsMode = useStore(selectionStoreFood, (s) => s.isActionsMode);
  const selectedIds = useStore(selectionStoreFood, (s) => s.selectedIds);
  const { clearSelection, setSelectedIds } = selectionStoreFood.getState();

  const showPrice = useUiStore((s) => s.scheduleFoodsShowPrice);
  const toggleShowPrice = useUiStore((s) => s.toggleScheduleFoodsShowPrice);

  const [isOpen, setIsOpen] = useState<
    'create-dish-and-copy' | 'copy-to-existing-dish' | 'copy-to-another-day' | null
  >(null);
  const [editingItem, setEditingItem] = useState<ScheduleFoodWithRelations | null>(null);
  const [editingStep, setEditingStep] = useState<'idle' | 'time' | 'search' | 'quantity'>('idle');
  const [dishChoiceMode, setDishChoiceMode] = useState(false);

  useSwipeableLock(isOpen !== null || editingItem !== null);
  const closeModal = () => setIsOpen(null);
  const openModal = (
    variant: 'create-dish-and-copy' | 'copy-to-existing-dish' | 'copy-to-another-day' | null
  ) => setIsOpen(variant);

  const closeEditModal = () => {
    setEditingItem(null);
    setEditingStep('idle');
  };

  const openEditModal = (item: ScheduleFoodWithRelations, step: 'time' | 'search' | 'quantity') => {
    setEditingItem(item);
    setEditingStep(step);
  };

  const onEditTime = useCallback((item: ScheduleFoodWithRelations) => openEditModal(item, 'time'), []);
  const onEditFood = useCallback((item: ScheduleFoodWithRelations) => openEditModal(item, 'search'), []);
  const onEditQuantity = useCallback((item: ScheduleFoodWithRelations) => openEditModal(item, 'quantity'), []);

  const getSelectedItemsWithProduct = () =>
    items.filter((item) => selectedIds.includes(item.id) && item.foodId != null);

  const groups = useMemo(() => groupItemsByTime(items), [items]);

  const onDeleteSelected = async () => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    const confirmed = await drawerStore.show(DeleteConfirmationModal, { count: ids.length });
    if (!confirmed) return;
    await removeScheduleFoods(ids);
    clearSelection();
    toaster.success(`Удалено: ${ids.length}`);
  };

  const openDishChoice = () => {
    const selectedProducts = getSelectedItemsWithProduct();
    if (selectedProducts.length === 0) {
      toaster.error('Надо выбрать хотя бы 1 элемент с продуктом, чтобы создать блюдо');
      return;
    }
    setDishChoiceMode(true);
  };

  const handleDishChoiceSelect = (variant: 'create-dish-and-copy' | 'copy-to-existing-dish') => {
    openModal(variant);
    setDishChoiceMode(false);
  };

  const onCopyToAnotherSchedule = () => {
    openModal('copy-to-another-day');
  };

  const handleBack = () => {
    if (dishChoiceMode) {
      setDishChoiceMode(false);
    } else {
      clearSelection();
    }
  };

  const selectedProductsFromSelectedFoods = getSelectedItemsWithProduct();

  const onModalActionFinish = () => {
    closeModal();
    clearSelection();
  };

  return (
    <Screen
      offsetTop
      overlay={
        <>
          <ScheduleFoodCreationModals scheduleId={date} />
          {editingItem && (
            <EditScheduleFoodModal
              item={editingItem}
              initialStep={editingStep}
              onClose={closeEditModal}
            />
          )}
          <CopyToNewDishModal
            isExpanded={isOpen === 'create-dish-and-copy'}
            items={selectedProductsFromSelectedFoods}
            onFinish={onModalActionFinish}
            onClose={onModalActionFinish}
          />
          <CopyToExistingDishModal
            isExpanded={isOpen === 'copy-to-existing-dish'}
            selectedIds={selectedIds}
            items={items}
            onFinish={onModalActionFinish}
            onClose={onModalActionFinish}
          />
          <CopyToAnotherDayScheduleModal
            isExpanded={isOpen === 'copy-to-another-day'}
            sourceDate={date}
            items={getSelectedItemsWithProduct()}
            onFinish={onModalActionFinish}
            onClose={onModalActionFinish}
          />
        </>
      }
      actions={
        <ActionsPanel
          show={isActionsMode}
          onBack={handleBack}
          left={
            dishChoiceMode ? null : (
              <IconButton icon={<TrashIcon />} onClick={onDeleteSelected}>
                Удалить
              </IconButton>
            )
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            {dishChoiceMode ? (
              <motion.div
                key="dish-choice"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ display: 'flex', gap: '0.5rem', flex: 1 }}
              >
                <label
                  htmlFor={MODAL_INPUT_IDS.DISH_NAME_INPUT}
                  onClick={() => handleDishChoiceSelect('create-dish-and-copy')}
                  style={dishChoiceBtnStyle}
                >
                  <NewDishIcon />
                  В новое
                </label>
                <label
                  htmlFor={MODAL_INPUT_IDS.SEARCH_INPUT}
                  onClick={() => handleDishChoiceSelect('copy-to-existing-dish')}
                  style={dishChoiceBtnStyle}
                >
                  <ExistingDishIcon />
                  В существующее
                </label>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ display: 'flex', gap: '1rem' }}
              >
                <IconButton
                  icon={<DishIcon />}
                  badge={selectedProductsFromSelectedFoods.length > 0 ? <CountBadge size="sm" count={selectedProductsFromSelectedFoods.length} /> : undefined}
                  onClick={openDishChoice}
                >
                  В блюдо
                </IconButton>
                <IconButton
                  icon={<CopyIcon />}
                  badge={selectedIds.length > 0 ? <CountBadge size="sm" count={selectedIds.length} /> : undefined}
                  onClick={onCopyToAnotherSchedule}
                >
                  Скопировать
                </IconButton>
              </motion.div>
            )}
          </AnimatePresence>
        </ActionsPanel>
      }
      header={
        <Navigation title={<Typography variant="feature-title">Еда</Typography>}></Navigation>
      }
      topLeft={null}
      bottomRight={
        isActionsMode ? null : (
          <AddButton onClick={() => {}} as="label" htmlFor={MODAL_INPUT_IDS.TIME_INPUT}>
            {items.length === 0 ? 'Добавить еду в этот день' : undefined}
          </AddButton>
        )
      }
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0.5rem',
          marginTop: '2rem',
        }}
      >
        <Button variant="ghost" onClick={() => toScheduleAnalytics(date)}>Анализ</Button>
        <Button variant="ghost" onClick={toFood}>Список еды</Button>
        <Button variant="ghost" onClick={toggleShowPrice} style={{ opacity: showPrice ? 1 : 0.5 }}>
          ₽
        </Button>
      </div>
      <ItemsList offsetTop>
        {groups.map((group) => (
          <TimeGroup
            key={group.time}
            group={group}
            onTimeClick={(group) => setSelectedIds(group.items.map((i: any) => i.id))}
          >
            {
              group.items.map((item) => (
                <ScheduleFoodItemComponent
                  key={item.id}
                  item={item}
                  selectionStore={selectionStoreFood}
                  showPrice={showPrice}
                  onEditTime={onEditTime}
                  onEditFood={onEditFood}
                  onEditQuantity={onEditQuantity}
                  timeHtmlFor={EDIT_MODAL_INPUT_IDS.TIME_INPUT}
                  foodHtmlFor={EDIT_MODAL_INPUT_IDS.SEARCH_INPUT}
                  quantityHtmlFor={EDIT_MODAL_INPUT_IDS.QUANTITY_INPUT}
                />
              )) as unknown as JSX.Element
            }
          </TimeGroup>
        ))}
      </ItemsList>
    </Screen>
  );
};

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DishIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 14h18M5 14c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 7V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 15H4a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2h9a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NewDishIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ExistingDishIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const dishChoiceBtnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: '6px 8px',
  borderRadius: 10,
  fontSize: '0.7rem',
  fontWeight: 600,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

export default FoodSchedule;

import { useMemo, useState } from 'react';
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
import { OpenFoods } from '@/features/food/open-foods';
import Button from '@/shared/ui/atoms/Button/Button';
import { useUiStore } from '@/shared/model/uiStore';
import AddButton from '@/shared/ui/atoms/Button/AddButton/AddButton';
import {
  ScheduleFoodCreationModals,
  MODAL_INPUT_IDS,
  CreateDishAndCopyModal,
  CopyToExistingDishModal,
  CopyToAnotherDayScheduleModal,
  EditScheduleFoodModal,
  EDIT_MODAL_INPUT_IDS,
} from '@/widgets/FoodSchedule/ui';
import { CountBadge } from '@/shared/ui/atoms/Button/CountBadge/CountBadge';
import { OpenScheduleFoodAnalytics } from '@/features/daySchedule/get-day-schedule-food-analytics/OpenScheduleFoodAnalytics';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { removeScheduleFoods } from '@/entities/schedule-food';

type CommonProps = {
  date: string;
  items: ScheduleFoodWithRelations[];
};

const FoodSchedule = ({ date, items }: CommonProps) => {
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

  const getSelectedItemsWithProduct = () =>
    items.filter((item) => selectedIds.includes(item.id) && item.foodId != null);

  const groups = useMemo(() => groupItemsByTime(items), [items]);

  const onDeleteSelected = async () => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    await removeScheduleFoods(ids);
    clearSelection();
    toaster.success(`Удалено: ${ids.length}`);
  };

  const onDishCreateButtonClick = () => {
    const selectedProducts = getSelectedItemsWithProduct();
    if (selectedProducts.length === 0) {
      toaster.error('Надо выбрать хотя бы 1 элемент с продуктом, чтобы создать блюдо');
      return;
    }
  };

  const openDishCreateModal = () => {
    onDishCreateButtonClick();
    openModal('create-dish-and-copy');
  };

  const openCopyToDishModal = () => {
    onDishCreateButtonClick();
    openModal('copy-to-existing-dish');
  };

  const onCopyToAnotherSchedule = () => {
    openModal('copy-to-another-day');
  };

  const selectedProductsFromSelectedFoods = getSelectedItemsWithProduct();

  // Adapt items for CopyToExistingDishModal which expects { id, contentProduct }
  const adaptedItemsForCopy = selectedProductsFromSelectedFoods.map((item) => ({
    id: item.id,
    contentProduct: {
      name: (item as any).food?.name ?? '—',
      foodId: item.foodId,
      quantity: item.quantity,
    },
  }));

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
          <CreateDishAndCopyModal
            isExpanded={isOpen === 'create-dish-and-copy'}
            items={selectedProductsFromSelectedFoods}
            onFinish={closeModal}
            onClose={closeModal}
          />
          <CopyToExistingDishModal
            isExpanded={isOpen === 'copy-to-existing-dish'}
            items={adaptedItemsForCopy}
            onFinish={closeModal}
            onClose={closeModal}
          />
          <CopyToAnotherDayScheduleModal
            isExpanded={isOpen === 'copy-to-another-day'}
            sourceDate={date}
            items={getSelectedItemsWithProduct()}
            onFinish={() => {
              closeModal();
              clearSelection();
            }}
            onClose={closeModal}
          />
        </>
      }
      actions={
        <ActionsPanel
          show={isActionsMode}
          onBack={() => clearSelection()}
          left={<button onClick={onDeleteSelected}>удалить</button>}
        >
          <label onClick={openDishCreateModal} htmlFor={MODAL_INPUT_IDS.DISH_NAME_INPUT}>
            в новое блюдо
          </label>
          <label onClick={openCopyToDishModal} htmlFor={MODAL_INPUT_IDS.SEARCH_INPUT}>
            в готовое блюдо
          </label>
          <button onClick={onCopyToAnotherSchedule}>copy</button>
        </ActionsPanel>
      }
      header={
        <Navigation title={<Typography variant="feature-title">Еда</Typography>}></Navigation>
      }
      topLeft={
        selectedIds.length > 0 ? (
          <CountBadge count={selectedIds.length} />
        ) : null
      }
      bottomRight={
        isActionsMode ? null : (
          <AddButton onClick={() => {}} as="label" htmlFor={MODAL_INPUT_IDS.TIME_INPUT} />
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
        <OpenScheduleFoodAnalytics date={date}>Анализ</OpenScheduleFoodAnalytics>
        <OpenFoods>Список еды</OpenFoods>
        <Button variant="ghost" onClick={toggleShowPrice} style={{ opacity: showPrice ? 1 : 0.5 }}>₽</Button>
      </div>
      <ItemsList offsetTop>
        {groups.map((group) => (
          <TimeGroup
            key={group.time}
            group={group}
            onTimeClick={(group) =>
              setSelectedIds(group.items.map((i: any) => i.id))
            }
          >
            {
              group.items.map((item) => (
                <ScheduleFoodItemComponent
                  key={item.id}
                  item={item}
                  selectionStore={selectionStoreFood}
                  showPrice={showPrice}
                  onEditTime={() => openEditModal(item, 'time')}
                  onEditFood={() => openEditModal(item, 'search')}
                  onEditQuantity={() => openEditModal(item, 'quantity')}
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

export default FoodSchedule;

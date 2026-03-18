import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import type { ScheduleFood } from '@/entities/schedule-food';
import { groupItemsByTime } from '@/shared/lib/schedule';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { TimeGroupUI } from '@/shared/lib/schedule';
import ScheduleFoodItemComponent from '@/components/widgets/FoodSchedule/ScheduleFoodItem/ScheduleFoodItem';
import { useSelection } from '@/hooks/factoryHooks/useSelection';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ActionsPanel } from '@/components/features/builders/shared/components/ActionsPanel';
import { Navigation } from '@/components/features/builders/ScheduleBuilder/ui/Navigation';
import Typography from '@/components/ui/atoms/Typography/Typography';
import { getScheduleFoodUrl, RouterLinks } from '@/router';
// TODO: migrate to drawerStore.show()
// import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
// TODO: migrate to Triplit hooks
// import { domainStore } from '@/store/store';
import { clearSessionStorage } from '@/infrastructure/storage/sessionStorage';
import { useNavigate } from 'react-router';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { modalStore } from '@/shared/ui/modal-store';
import { ModalCopyScheduleFoodsToAnotherDay } from '@/components/features/builders/ScheduleBuilder/components/modal/ModalCopyScheduleFoodsToAnotherDay';
import toaster from '@/infrastructure/toaster/toaster';
import { OpenFoods } from '@/components/features/food/open-foods';
import { FoodShowCost } from '@/components/features/food/food-show-cost';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import {
  CreateDishAndCopyModal,
  CopyToExistingDishModal,
} from '@/components/widgets/FoodSchedule/ui';
import { drawerStore } from '@/shared/ui/drawer-store';
import { CopyFoodToDaySchedule } from '@/components/features/daySchedule/copy-food-to-day-schedule/CopyFoodFromDayScheduleOverlay';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { CountBadge } from '@/components/ui/atoms/Button/CountBadge/CountBadge';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { OpenScheduleFoodAnalytics } from '@/components/features/daySchedule/get-day-schedule-food-analytics/OpenScheduleFoodAnalytics';
import AddFoodItemToDaySchedule from '@/components/features/daySchedule/add-food-item-to-current-day-schedule/AddFoodItemToDaySchedule';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';

type CommonProps = {
  date: string;
  items: ScheduleFood[];
};

const FoodSchedule = observer(({ date, items }: CommonProps) => {
  const navigate = useNavigate();
  const selectionStoreFood = useSelection();

  const [isOpen, setIsOpen] = useState<'create-dish-and-copy' | 'copy-to-existing-dish' | null>(
    null
  );
  useSwipeableLock(isOpen !== null);
  const closeDishCreateModal = () => setIsOpen(null);
  const openDishModal = (variant: 'create-dish-and-copy' | 'copy-to-existing-dish' | null) =>
    setIsOpen(variant);

  const onFoodAddButtonClick = () => {
    // Step transition handled by label htmlFor="time-input-schedule-food" focus delegation
  };

  const getSelectedItemsWithProduct = () =>
    items.filter((item) => selectionStoreFood.selectedIds.includes(item.id) && item.food != null);

  const getSelectedItems = () =>
    items.filter((item) => selectionStoreFood.selectedIds.includes(item.id));

  const groups = useMemo(() => groupItemsByTime(items), [items]);

  const onCopyToAnotherDayButtonClick = async () => {
    const { date: targetDate, mode } = await modalStore.show(ModalCopyScheduleFoodsToAnotherDay, {
      title: 'Перенести приёмы пищи на другой день',
      defaultMode: 'move',
    });

    if (!targetDate) {
      return;
    }

    // TODO: migrate to Triplit mutation
    // interactionsService.moveOrCopyItemsFromOneScheduleToAnother(
    //   date, targetDate, mode, selectionStoreFood.selectedIds
    // );

    toaster.success(
      `Приёмы пищи успешно ${mode === 'copy' ? 'скопированы' : 'перемещены'} на ${targetDate}`
    );
    selectionStoreFood.clearSelection();
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
    openDishModal('create-dish-and-copy');
  };

  const openCopyToDishModal = () => {
    onDishCreateButtonClick();
    openDishModal('copy-to-existing-dish');
  };

  const onCreateDishAndCopyFinish = () => {
    closeDishCreateModal();
  };

  const onCopyToAnotherSchedule = () => {
    const selectedProducts = getSelectedItems();
    modalStore.show(CopyFoodToDaySchedule, { items: selectedProducts });
  };

  const selectedProductsFromSelectedFoods = getSelectedItemsWithProduct();

  const [selectedDish, setSelectedDish] = useState();

  return (
    <Screen
      offsetTop
      overlay={
        <>
          <AddFoodItemToDaySchedule scheduleId={date} />
          <CreateDishAndCopyModal
            isExpanded={isOpen === 'create-dish-and-copy'}
            items={selectedProductsFromSelectedFoods}
            onFinish={onCreateDishAndCopyFinish}
            onClose={closeDishCreateModal}
          />
          <CopyToExistingDishModal
            isExpanded={isOpen === 'copy-to-existing-dish'}
            items={getSelectedItemsWithProduct()}
            onFinish={() => closeDishCreateModal()}
            onClose={closeDishCreateModal}
          />
        </>
      }
      actions={
        <ActionsPanel
          show={selectionStoreFood.isActionsMode}
          onBack={() => selectionStoreFood.clearSelection()}
          left={
            <button
              onClick={() => {
                // TODO: migrate to drawerStore.show() for delete confirmation
              }}
            >
              удалить
            </button>
          }
        >
          <label onClick={openDishCreateModal} htmlFor="dish-name-input">
            в новое блюдо
          </label>
          <label onClick={openCopyToDishModal} htmlFor="search">
            в готовое блюдо
          </label>
          <button onClick={onCopyToAnotherSchedule}>copy</button>
        </ActionsPanel>
      }
      // title={<Typography variant="feature-title">Еда</Typography>}
      header={
        <Navigation title={<Typography variant="feature-title">Еда</Typography>}></Navigation>
      }
      topLeft={
        selectionStoreFood.selectedIds.length > 0 ? (
          <CountBadge count={selectionStoreFood.selectedIds.length} />
        ) : null
      }
      bottomRight={
        selectionStoreFood.isActionsMode ? null : (
          <AddButton onClick={onFoodAddButtonClick} as="label" htmlFor="time-input-schedule-food" />
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
        <OpenScheduleFoodAnalytics date={date} />
        <OpenFoods>Список еды</OpenFoods>
        <FoodShowCost />
      </div>
      <ItemsList offsetTop>
        {groups.map((group) => (
          <TimeGroup
            key={group.time}
            group={group}
            onTimeClick={(group) => selectionStoreFood.setSelectedIds(group.items.map((i) => i.id))}
          >
            {group.items.map((item) => (
              <ScheduleFoodItemComponent
                scheduleId={date}
                key={item.id}
                item={item}
                selectionStore={selectionStoreFood}
              />
            )) as unknown as JSX.Element}
          </TimeGroup>
        ))}
      </ItemsList>
    </Screen>
  );
});

export default FoodSchedule;

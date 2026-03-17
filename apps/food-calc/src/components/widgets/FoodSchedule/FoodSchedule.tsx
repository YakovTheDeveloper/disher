import { observer } from 'mobx-react-lite';
import { useCallback, useRef, useState } from 'react';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import {
  ScheduleFoodsItem,
  ScheduleFoods,
} from '@/domain/schedule/scheduleFood/ScheduleFoods.model';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { getIds } from '@/domain/common';
import { TimeGroupUI } from '@/domain/schedule/schedule.service';
import ScheduleFoodItemComponent from '@/components/widgets/FoodSchedule/ScheduleFoodItem/ScheduleFoodItem';
import { useSelection } from '@/hooks/factoryHooks/useSelection';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ActionsPanel } from '@/components/features/builders/shared/components/ActionsPanel';
import { Navigation } from '@/components/features/builders/ScheduleBuilder/ui/Navigation';
import Typography from '@/components/ui/atoms/Typography/Typography';
import { getScheduleFoodUrl, RouterLinks } from '@/router';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { domainStore } from '@/store/store';
import { clearSessionStorage } from '@/infrastructure/storage/sessionStorage';
import { useNavigate } from 'react-router';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { modalStoreV2 } from '@/store/GlobalUiStore/ModalStoreV2/ModalStoreV2';
import { ModalCopyScheduleItemsToAnotherDay } from '@/components/features/builders/ScheduleBuilder/components/modal/ModalCopyScheduleItemsToAnotherDay';
import toaster from '@/infrastructure/toaster/toaster';
import { OpenFoods } from '@/components/features/food/open-foods';
import { FoodShowCost } from '@/components/features/food/food-show-cost';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import { CopyProductsToExistingDish } from '@/components/features/dish/copy-products-to-dish/CreateDishFromProductList';
import { CreateDishAndCopyProducts } from '@/components/features/dish/create-dish-and-copy-products';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { drawerStoreV3 } from '@/store/GlobalUiStore/DrawerStoreV3/DrawerStoreV3';
import { CopyFoodToDaySchedule } from '@/components/features/daySchedule/copy-food-to-day-schedule/CopyFoodFromDayScheduleOverlay';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import { CountBadge } from '@/components/ui/atoms/Button/CountBadge/CountBadge';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { OpenScheduleFoodAnalytics } from '@/components/features/daySchedule/get-day-schedule-food-analytics/OpenScheduleFoodAnalytics';
import AddFoodItemToDaySchedule from '@/components/features/daySchedule/add-food-item-to-current-day-schedule/AddFoodItemToDaySchedule';
import { useSwipeableLock } from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableLockContext';

type CommonProps = {
  schedule: Instance<typeof ScheduleFoods>;
  interactionsService?: typeof domainStore.interactionsService;
};

const FoodSchedule = observer(
  ({ schedule, interactionsService = domainStore.interactionsService }: CommonProps) => {
    const navigate = useNavigate();
    const selectionStoreFood = useSelection();

    const [isOpen, setIsOpen] = useState<'create-dish-and-copy' | 'copy-to-existing-dish' | null>(
      null
    );
    useSwipeableLock(isOpen !== null);
    const swapProductsToDishCheckboxInputRef = useRef<HTMLInputElement>(null);
    const closeDishCreateModal = () => setIsOpen(null);
    const openDishModal = (variant: 'create-dish-and-copy' | 'copy-to-existing-dish' | null) =>
      setIsOpen(variant);

    const onFoodAddButtonClick = () => {
      // Step transition handled by label htmlFor="time-input-schedule-food" focus delegation
    };

    const onCopyToAnotherDayButtonClick = async () => {
      const { date, mode } = await modalStoreV2.show(ModalCopyScheduleItemsToAnotherDay, {
        title: 'Перенести приёмы пищи на другой день',
        defaultMode: 'move',
      });

      if (!date) {
        return;
      }

      interactionsService.moveOrCopyItemsFromOneScheduleToAnother(
        schedule.id,
        date,
        mode,
        selectionStoreFood.selectedIds
      );

      toaster.success(
        `Приёмы пищи успешно ${mode === 'copy' ? 'скопированы' : 'перемещены'} на ${date}`
      );
      selectionStoreFood.clearSelection();
    };

    const onDishCreateButtonClick = () => {
      const selectedProducts = schedule.getChildrenListWithProductContentByIds(
        selectionStoreFood.selectedIds
      );
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

    const onCreateDishAndCopyFinish = (dishId: string, selectedProductIds: string[]) => {
      if (swapProductsToDishCheckboxInputRef.current?.checked) {
        schedule.swapProductsToDish(selectedProductIds, dishId);
      }
      closeDishCreateModal();
    };

    const onCopyToAnotherSchedule = () => {
      const selectedProducts = schedule.getChildrenWithAnyExistingContentByIds(
        selectionStoreFood.selectedIds
      );
      modalStoreV2.show(CopyFoodToDaySchedule, { items: selectedProducts });
    };

    const selectedProductsFromSelectedFoods = schedule.getChildrenListWithProductContentByIds(
      selectionStoreFood.selectedIds
    );

    const [selectedDish, setSelectedDish] = useState();

    return (
      <Screen
        offsetTop
        overlay={
          <>
            <AddFoodItemToDaySchedule scheduleId={schedule.id} />
            <SearchFormExpandable
              position="absolute"
              isExpanded={isOpen === 'create-dish-and-copy'}
              content={
                <CreateDishAndCopyProducts
                  onClose={closeDishCreateModal}
                  items={selectedProductsFromSelectedFoods}
                  onFinish={onCreateDishAndCopyFinish}
                ></CreateDishAndCopyProducts>
              }
            />
            <SearchFormExpandable
              position="absolute"
              isExpanded={isOpen === 'copy-to-existing-dish'}
              content={
                <CopyProductsToExistingDish
                  onClose={closeDishCreateModal}
                  items={schedule.getChildrenListWithProductContentByIds(
                    selectionStoreFood.selectedIds
                  )}
                  onFinish={closeDishCreateModal}
                />
              }
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
                  domainStore.globalUiStore.drawerStore.open({
                    type: DrawerTypesV2.Confirmation.RemoveScheduleFood,
                  });
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
            <AddButton
              onClick={onFoodAddButtonClick}
              as="label"
              htmlFor="time-input-schedule-food"
            />
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
          <OpenScheduleFoodAnalytics date={schedule.id} />
          <OpenFoods>Список еды</OpenFoods>
          <FoodShowCost />
        </div>
        <ItemsList offsetTop>
          {schedule.foodsGroupedByTime.map((group) => (
            <TimeGroup
              key={group.time}
              group={group}
              onTimeClick={(group) => selectionStoreFood.setSelectedIds(getIds(group.items))}
            >
              {group.items.map((item) => (
                <ScheduleFoodItemComponent
                  scheduleId={schedule.id}
                  key={item.id}
                  item={item}
                  selectionStore={selectionStoreFood}
                  showCost={domainStore.globalUiStore.options.showCost}
                />
              ))}
            </TimeGroup>
          ))}
        </ItemsList>
      </Screen>
    );
  }
);

export default FoodSchedule;

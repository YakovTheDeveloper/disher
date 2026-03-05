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
import { ActionsHeader } from '@/components/features/builders/shared/components/ActionsHeader';
import { Navigation } from '@/components/features/builders/ScheduleBuilder/ui/Navigation';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { getScheduleFoodUrl, RouterLinks } from '@/router';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { domainStore } from '@/store/store';
import { clearSessionStorage } from '@/infrastructure/storage/sessionStorage';
import { useNavigate } from 'react-router';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { modalStoreV2 } from '@/store/GlobalUiStore/ModalStoreV2/ModalStoreV2';
import { ModalCopyScheduleItemsToAnotherDay } from '@/components/features/builders/ScheduleBuilder/components/modal/ModalCopyScheduleItemsToAnotherDay';
import toaster from '@/infrastructure/toaster/toaster';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { OpenDishes } from '@/components/features/dish/OpenDishes';
import { OpenProducts } from '@/components/features/product/OpenProducts';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import { LabeledCheckbox } from '@/components/ui/LabeledCheckbox';
import { CreateDishFromProductList } from '@/components/features/dish/create-dish-from-product-list/CreateDishFromProductList';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';

type CommonProps = {
  schedule: Instance<typeof ScheduleFoods>;
  interactionsService?: typeof domainStore.interactionsService;
};

const FoodSchedule = observer(
  ({ schedule, interactionsService = domainStore.interactionsService }: CommonProps) => {
    const navigate = useNavigate();
    const selectionStoreFood = useSelection();
    const { toScheduleFood } = useAppRoutes();
    const [isOpen, setIsOpen] = useState(false);
    const [shouldReplace, setIsOpen] = useState(false);

    const onFoodAddV2 = () => {
      clearSessionStorage(`tabs:${location.pathname}`);

      toScheduleFood(schedule.id, 'draft');

      requestAnimationFrame(() => {
        document.getElementById('time-picker-hours-label')?.click();
      });
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

    const open = () => {
      if (selectionStoreFood.selectedIds.length === 0) {
        toaster.error('Надо выбрать хотя бы 1 элемент с продуктом, чтобы создать блюдо');
        return;
      }
      setIsOpen(true);
    };

    const onDishCreateFinish = (dishId: string) => {
      schedule.swapProductsToDish(['0'], dishId);
      setIsOpen(false);
    };

    return (
      <Screen
        offsetTop
        overlay={
          <SearchFormExpandable
            isExpanded={isOpen}
            content={
              <CreateDishFromProductList
                items={schedule.getProductOnlyChildrenByIds(selectionStoreFood.selectedIds)}
                onFinish={onDishCreateFinish}
              >
                <LabeledCheckbox
                  onChange={() => {}}
                  label="Заменить выбранные продукты на новое блюдо"
                />
              </CreateDishFromProductList>
            }
          />
        }
        actions={
          <ActionsHeader
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
            <button onClick={open}>создать блюдо</button>
            <button onClick={onCopyToAnotherDayButtonClick}>move/copy</button>
          </ActionsHeader>
        }
        title={
          <ScreenLabel
            variant="screenHeader"
            onClick={() => {
              navigate(RouterLinks.Dishes + `?from_date=${schedule.id}`);
            }}
          >
            Еда
          </ScreenLabel>
        }
        header={<Navigation title="Еда"></Navigation>}
        bottomRight={selectionStoreFood.isActionsMode ? null : <AddButton onClick={onFoodAddV2} />}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem',
            marginTop: '2rem',
          }}
        >
          <OpenDishes />
          <OpenProducts />
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

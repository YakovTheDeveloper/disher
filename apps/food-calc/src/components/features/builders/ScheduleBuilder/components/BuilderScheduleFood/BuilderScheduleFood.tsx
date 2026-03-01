import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import {
  ScheduleFoodsItem as ScheduleFoodItemModel,
  ScheduleFoods,
} from '@/domain/schedule/scheduleFood/ScheduleFoods.model';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { getIds } from '@/domain/common';
import { TimeGroupUI } from '@/domain/schedule/schedule.service';
import ScheduleFoodItemComponent from '@/components/features/builders/ScheduleBuilder/components/BuilderScheduleFood/ScheduleFoodItem/ScheduleFoodItem';
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

type CommonProps = {
  schedule: Instance<typeof ScheduleFoods>;
  interactionsService?: typeof domainStore.interactionsService;
};

const BuilderScheduleFood = observer(
  ({ schedule, interactionsService = domainStore.interactionsService }: CommonProps) => {
    const navigate = useNavigate();
    const selectionStoreFood = useSelection();

    const renderScheduleFoodItem = useCallback((item: Instance<typeof ScheduleFoodItemModel>) => {
      return (
        <ScheduleFoodItemComponent key={item.id} item={item} selectionStore={selectionStoreFood} />
      );
    }, []);

    const onFoodAddV2 = () => {
      clearSessionStorage(`tabs:${location.pathname}`);

      navigate(getScheduleFoodUrl(schedule.id, 'draft'));

      requestAnimationFrame(() => {
        document.getElementById('time-picker-hours-label')?.click();
      });
    };

    const onCreateDishButtonClick = () => {
      // interactionsService.createNewDishAndAppendToSchedule(schedule);
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

    console.log('from list');
    return (
      <Screen
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
            <button onClick={onCreateDishButtonClick}>создать новое блюдо</button>
            <button onClick={onCopyToAnotherDayButtonClick}>перенести еду в другой день</button>
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
        header={<Navigation></Navigation>}
        bottom={selectionStoreFood.isActionsMode ? null : <Buttons.Add onClick={onFoodAddV2} />}
      >
        <ItemsList offsetTop>
          {schedule.foodsGroupedByTime.map((group) => (
            <TimeGroup
              key={group.time}
              group={group}
              onTimeClick={(group) => selectionStoreFood.setSelectedIds(getIds(group.items))}
            >
              {renderScheduleFoodItem}
            </TimeGroup>
          ))}
        </ItemsList>
      </Screen>
    );
  }
);

export default BuilderScheduleFood;

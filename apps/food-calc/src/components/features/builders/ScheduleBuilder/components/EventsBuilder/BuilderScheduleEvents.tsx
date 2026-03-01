import { observer } from 'mobx-react-lite';
import styles from './BuilderScheduleEvents.module.scss';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { useCallback } from 'react';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import clsx from 'clsx';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { ScheduleEvent } from '@/domain/schedule/scheduleEvent/ScheduleEvent.model';
import { useOverlay } from '@/store/GlobalUiStore/OverlayStore';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Navigation } from '@/components/features/builders/ScheduleBuilder/ui/Navigation';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ActionsHeader } from '@/components/features/builders/shared/components/ActionsHeader';
import { getScheduleEventUrl } from '@/router';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { domainStore } from '@/store/store';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { useNavigate } from 'react-router';
import { useSelection } from '@/hooks/factoryHooks/useSelection';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

export function getEventDescription(item: Instance<typeof ScheduleEvent>): string {
  const variant = item.type;

  switch (variant) {
    case 'sleep':
      return `Сон: ${item.value}, качество ${item.value}/10`;
    case 'mood':
      return `Настроение: ${item.value}/10`;
    case 'energy':
      return `Энергия: ${item.value}/10`;
    case 'digestion':
      return `Пищеварение (${item.type}): ${item.value}/10`;
    case 'activity':
      return `Активность: ${item.type}, ${item.value}`;
    case 'note':
      return `Заметка: ${item.value}`;
  }
}

const BuilderScheduleEvents = ({ schedule }: Props) => {
  const { openFormScheduleEventEdit } = useOverlay();
  const navigate = useNavigate();
  const selectionStoreEvents = useSelection();

  const onEventEditModalOpen = (item: Instance<typeof ScheduleEvent>) => {
    openFormScheduleEventEdit({ itemToEditId: item.id, defaultTab: 'content' });
  };

  const renderEventListItem = useCallback((item: Instance<typeof ScheduleEvent>) => {
    return (
      <CommonListItem className={styles.listItemRow} id={item.id} key={item.id} sync={item.sync}>
        <p onClick={() => onEventEditModalOpen(item)}>{getEventDescription(item)}</p>
      </CommonListItem>
    );
  }, []);

  const onEventAdd = () => {
    // TODO: make link to new route
    navigate(getScheduleEventUrl(schedule.id, 'draft'));
  };

  return (
    <>
      <Screen
        actions={
          <ActionsHeader
            show={selectionStoreEvents.isActionsMode}
            onBack={() => selectionStoreEvents.clearSelection()}
            left={
              <button
                onClick={() => {
                  domainStore.globalUiStore.drawerStore.open({
                    type: DrawerTypesV2.Confirmation.RemoveScheduleEvents,
                  });
                }}
              >
                удалить
              </button>
            }
          >
            экшены событий
          </ActionsHeader>
        }
        key={3}
        title={<ScreenLabel variant="screenHeader">События</ScreenLabel>}
        header={<Navigation></Navigation>}
        bottom={<Buttons.Add onClick={onEventAdd} />}
      >
        <section className={clsx(['builder__time-groups', styles.eventsBuilder])}>
          <ItemsList offsetTop>
            {schedule.eventsGroupedByTime.map((timeGroup) => (
              <TimeGroup key={timeGroup.time} group={timeGroup}>
                {renderEventListItem}
              </TimeGroup>
            ))}
          </ItemsList>
        </section>
      </Screen>

      {/* <Actions isShow={() => true}>
        <ActionButton.Finish onClick={onFinishHandler} content={vm}>
          обновить
        </ActionButton.Finish>
        <ActionButton.Add onClick={onEventContentCreateModalOpen} />
        <ActionButton.AdditionalOptions options={options} />
      </Actions> */}
    </>
  );
};

export default observer(BuilderScheduleEvents);

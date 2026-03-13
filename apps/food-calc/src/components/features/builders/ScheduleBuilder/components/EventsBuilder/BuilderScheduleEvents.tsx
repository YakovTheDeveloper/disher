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
import Typography from '@/components/ui/atoms/Typography/Typography';
import { ActionsPanel } from '@/components/features/builders/shared/components/ActionsPanel';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { domainStore } from '@/store/store';
import { useSelection } from '@/hooks/factoryHooks/useSelection';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import AddEventItemToDaySchedule from '@/components/features/dayScheduleEvent/add-event-item-to-current-day-schedule/AddEventItemToDaySchedule';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

export function getEventDescription(item: Instance<typeof ScheduleEvent>): string {
  const parts: string[] = [];

  // Add time if available
  if (item.time) {
    parts.push(item.time);
  }

  // Add text if available
  if (item.text) {
    parts.push(item.text);
  }

  // Add relevant atoms for context
  const tags = item.getAtomsByKind('tag');
  if (tags.length > 0) {
    const tagValues = tags.map((atom) => atom.value).join(', ');
    parts.push(`[${tagValues}]`);
  }

  const flags = item.getAtomsByKind('flag');
  if (flags.length > 0) {
    const flagValues = flags.map((atom) => atom.value).join(', ');
    parts.push(`★${flagValues}`);
  }

  // If nothing is set, show placeholder
  if (parts.length === 0) {
    return 'Новое событие';
  }

  return parts.join(' • ');
}

const BuilderScheduleEvents = ({ schedule }: Props) => {
  const { openFormScheduleEventEdit } = useOverlay();
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

  return (
    <Screen
      offsetTop
      overlay={<AddEventItemToDaySchedule scheduleId={schedule.id} />}
      actions={
        <ActionsPanel
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
        </ActionsPanel>
      }
      key={3}
      title={<Typography variant="feature-title">События</Typography>}
      header={
        <Navigation title={<Typography variant="feature-title-2">События</Typography>}></Navigation>
      }
      bottomRight={<AddButton htmlFor="time-input" as="label" />}
    >
      <section className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <ItemsList offsetTop>
          {schedule.eventsGroupedByTime.map((timeGroup) => (
            <TimeGroup key={timeGroup.time} group={timeGroup}>
              {timeGroup.items.map((item: Instance<typeof ScheduleEvent>) => {
                return (
                  <CommonListItem
                    className={styles.listItemRow}
                    id={item.id}
                    key={item.id}
                    sync={item.sync}
                  >
                    <p onClick={() => onEventEditModalOpen(item)}>{getEventDescription(item)}</p>
                  </CommonListItem>
                );
              })}
            </TimeGroup>
          ))}
        </ItemsList>
      </section>
    </Screen>
  );
};

export default observer(BuilderScheduleEvents);

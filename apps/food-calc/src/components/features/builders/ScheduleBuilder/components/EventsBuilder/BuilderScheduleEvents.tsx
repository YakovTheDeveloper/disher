import { observer } from 'mobx-react-lite';
import styles from './BuilderScheduleEvents.module.scss';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { useCallback, useMemo } from 'react';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import type { ScheduleEvent } from '@/entities/schedule-event';
import clsx from 'clsx';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Navigation } from '@/components/features/builders/ScheduleBuilder/ui/Navigation';
import Typography from '@/components/ui/atoms/Typography/Typography';
import { ActionsPanel } from '@/components/features/builders/shared/components/ActionsPanel';
import { useSelection } from '@/hooks/factoryHooks/useSelection';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import AddEventItemToDaySchedule from '@/components/features/dayScheduleEvent/add-event-item-to-current-day-schedule/AddEventItemToDaySchedule';
import { groupItemsByTime } from '@/shared/lib/schedule';
import { drawerStore } from '@/shared/ui/drawer-store';

type Props = {
  children?: React.ReactNode;
  date: string;
  events: ScheduleEvent[];
};

export function getEventDescription(item: ScheduleEvent): string {
  const parts: string[] = [];

  if (item.time) {
    parts.push(item.time);
  }

  if (item.text) {
    parts.push(item.text);
  }

  // TODO: atoms access — check if ScheduleEvent Triplit entity has getAtomsByKind or adapt
  // const tags = item.getAtomsByKind('tag');
  // const flags = item.getAtomsByKind('flag');

  if (parts.length === 0) {
    return 'Новое событие';
  }

  return parts.join(' • ');
}

const BuilderScheduleEvents = ({ date, events }: Props) => {
  const selectionStoreEvents = useSelection();
  const eventsGroupedByTime = useMemo(() => groupItemsByTime(events), [events]);

  const onEventEditModalOpen = (item: ScheduleEvent) => {
    // TODO: migrate to drawerStore.show() for event edit
  };

  return (
    <Screen
      offsetTop
      overlay={<AddEventItemToDaySchedule scheduleId={date} />}
      actions={
        <ActionsPanel
          show={selectionStoreEvents.isActionsMode}
          onBack={() => selectionStoreEvents.clearSelection()}
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
          {eventsGroupedByTime.map((timeGroup) => (
            <TimeGroup key={timeGroup.time} group={timeGroup}>
              {timeGroup.items.map((item) => {
                return (
                  <CommonListItem
                    className={styles.listItemRow}
                    id={item.id}
                    key={item.id}
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

import { observer } from 'mobx-react-lite';
import styles from './BuilderScheduleEvents.module.scss';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { useCallback } from 'react';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import clsx from 'clsx';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { EventItem } from '@/domain/schedule/scheduleEvent/scheduleEvent';
import { ScheduleEventItem } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/ScheduleEventItem';
type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

const BuilderScheduleEvents = ({ schedule }: Props) => {
  const renderEventListItem = useCallback(
    (item: Instance<typeof EventItem>) => {
      return (
        <CommonListItem className={styles.listItemRow} id={item.id} key={item.id} sync={item.sync}>
          <ScheduleEventItem item={item} />
        </CommonListItem>
      );
    },
    [schedule]
  );

  return (
    <>
      <section className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <ItemsList offsetTop>
          {schedule.eventsGroupedByTime.map((timeGroup) => (
            <TimeGroup key={timeGroup.time} group={timeGroup}>
              {renderEventListItem}
            </TimeGroup>
          ))}
        </ItemsList>
      </section>
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

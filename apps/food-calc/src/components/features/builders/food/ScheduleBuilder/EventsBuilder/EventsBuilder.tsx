import { observer } from 'mobx-react-lite';
import styles from './EventsBuilder.module.scss';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import { useCallback } from 'react';
import { EventListItem } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventListItem';
import { TimeGroup } from '@/components/features/builders/food/ScheduleBuilder/ui/List/TimeGroup';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, EventItem } from '@/domain/schedule/schedule';
import clsx from 'clsx';
import { ItemsList } from '@/components/ui/atoms/ItemsList';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
  onEventContentUpdateModalOpen: (id: string | number) => void;
  onEventContentCreateModalOpen: () => void;
  onEventTimeModalOpen: (id: string | number) => void;
  options: {
    showAdditionals: boolean;
  };
};

const EventsBuilder = ({
  schedule,
  onEventContentUpdateModalOpen,
  onEventContentCreateModalOpen,
  onEventTimeModalOpen,
  options,
}: Props) => {
  const onFinishHandler = useCallback(() => {
    // updateDailyEvents
    // onFinish(vm.payload());
  }, [schedule]);

  const renderEventListItem = useCallback(
    (item: Instance<typeof EventItem>) => {
      return (
        <CommonListItem
          className={styles.listItemRow}
          id={item.id}
          onDelete={schedule.events.removeChild}
          key={item.id}
          sync={item.sync}
          showAdditionals={options.showAdditionals}
        >
          <EventListItem
            item={item}
            onContentModalOpen={onEventContentUpdateModalOpen}
            onTimeModalOpen={onEventTimeModalOpen}
          />
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

export default observer(EventsBuilder);

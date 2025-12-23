import { observer } from 'mobx-react-lite';
import styles from './EventsBuilder.module.scss';
import { CommonListItem } from '@/components/blocks/builders/food/shared/ui/CommonListItem';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
import { useCallback, useMemo } from 'react';
import {
  DayEventsBuilderViewModel,
  ScheduleQuestionnaireItemUI,
} from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';
import { Button as ActionButton } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { EventListItem } from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/components/EventListItem';
import { TimeGroup } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List/TimeGroup';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, EventItem } from '@/domain/schedule/schedule';

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
      <section className="builder__time-groups">
        {schedule.eventsGroupedByTime.map((timeGroup) => (
          <TimeGroup key={timeGroup.time} group={timeGroup}>
            {renderEventListItem}
          </TimeGroup>
        ))}
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

import { observer } from 'mobx-react-lite';
import styles from './BuilderScheduleEvents.module.scss';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { useCallback } from 'react';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import clsx from 'clsx';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { ScheduleEventItem } from '@/domain/schedule/scheduleEvent/ScheduleEvent.model';
import { useOverlay } from '@/store/GlobalUiStore/OverlayStore';
type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

export function getEventDescription(item: Instance<typeof ScheduleEventItem>): string {
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

  const onEventEditModalOpen = (item: Instance<typeof ScheduleEventItem>) => {
    openFormScheduleEventEdit(item.id, 'content');
  };

  const renderEventListItem = useCallback(
    (item: Instance<typeof ScheduleEventItem>) => {
      return (
        <CommonListItem className={styles.listItemRow} id={item.id} key={item.id} sync={item.sync}>
          <p onClick={() => onEventEditModalOpen(item)}>{getEventDescription(item)}</p>
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

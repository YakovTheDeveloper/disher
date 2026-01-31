import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { ScheduleListItem } from '@/components/features/builders/ScheduleBuilder/components/BuilderScheduleFood/ScheduleListItem';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule.model';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { domainStore } from '@/store/store';
import { getIds } from '@/domain/common';
import { TimeGroupUI } from '@/domain/schedule/schedule.service';

type CommonProps = {
  schedule: Instance<typeof DaySchedule>;
};

const ListWrapper = observer(({ schedule, ...restProps }: CommonProps) => {
  const length = schedule.foodsGroupedByTime.length;
  console.log(length);
  return (
    <BuilderScheduleFood
      items={schedule.foodsGroupedByTime}
      schedule={schedule}
      length={length}
      {...restProps}
    />
  );
});

type Props = Omit<CommonProps, 'schedule'> & {
  length: number;
  schedule: Instance<typeof DaySchedule>;
  items: TimeGroupUI<Instance<typeof ScheduleItem>>[];
  interactions?: typeof domainStore.interactionsService;
};

const BuilderScheduleFood = observer(
  ({ items, length, schedule, interactions = domainStore.interactionsService }: Props) => {
    const renderItem = useCallback((item: Instance<typeof ScheduleItem>) => {
      return <ScheduleListItem key={item.id} item={item} controller={schedule} />;
    }, []);

    console.log('from list');
    return (
      <ItemsList offsetTop>
        {items.map((group) => (
          <TimeGroup
            key={group.time}
            group={group}
            onTimeClick={(group) =>
              interactions.interactionsSelect.setSelectedIds(getIds(group.items))
            }
          >
            {renderItem}
          </TimeGroup>
        ))}
      </ItemsList>
    );
  }
);

export default ListWrapper;

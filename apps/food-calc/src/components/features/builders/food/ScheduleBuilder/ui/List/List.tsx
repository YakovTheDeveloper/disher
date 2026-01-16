import { observer } from 'mobx-react-lite';
import styles from './List.module.scss';
import { BuilderUIStore } from '@/components/features/builders/food/shared/BuilderUIStore';
import { useCallback } from 'react';
import { Item } from '@/components/features/builders/food/ScheduleBuilder/ui/List/Item';
import { ItemActions } from '@/components/features/builders/food/ScheduleBuilder/types';
import { TimeGroup } from '@/components/features/builders/food/ScheduleBuilder/ui/List/TimeGroup';
import clsx from 'clsx';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
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
    <List items={schedule.foodsGroupedByTime} schedule={schedule} length={length} {...restProps} />
  );
});

type Props = Omit<CommonProps, 'schedule'> & {
  length: number;
  schedule: Instance<typeof DaySchedule>;
  items: TimeGroupUI<Instance<typeof ScheduleItem>>[];
  uiStore?: typeof domainStore.globalUiStore;
};

const List = observer(({ items, length, schedule, uiStore = domainStore.globalUiStore }: Props) => {
  const renderItem = useCallback((item: Instance<typeof ScheduleItem>) => {
    return <Item key={item.id} item={item} controller={schedule} />;
  }, []);

  console.log('from list');
  return (
    <ItemsList offsetTop>
      {items.map((group) => (
        <TimeGroup
          key={group.time}
          group={group}
          onTimeClick={(group) => uiStore.setSelectedIds(getIds(group.items))}
        >
          {renderItem}
        </TimeGroup>
      ))}
    </ItemsList>
  );
});

export default ListWrapper;

import { observer } from 'mobx-react-lite';
import styles from './List.module.scss';
import {
  DayScheduleItemUI,
  TimeGroupUI,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
import { useCallback } from 'react';
import { Item } from '@/components/blocks/builders/food/ScheduleBuilder/ui/List/Item';
import { ItemActions } from '@/components/blocks/builders/food/ScheduleBuilder/types';
import { TimeGroup } from '@/components/blocks/builders/food/ScheduleBuilder/ui/TimeGroup';
import { WithOverlay } from '@/components/ui/Overlay';
import Overlay from '@/components/ui/Overlay/Overlay';

type CommonProps = {
  options: BuilderUIStore;
  onDishesUnite: (group: TimeGroupUI) => void;
  itemActions: ItemActions;
  content: {
    itemsGroupedByTime: TimeGroupUI[];
  };
  getLoadingState: () => boolean;
};
type Props = Omit<CommonProps, 'content' | 'getLoadingState'> & {
  length: number;
  content: TimeGroupUI[];
};

const ListWrapper = observer(({ content, getLoadingState, ...restProps }: CommonProps) => {
  const length = content.itemsGroupedByTime.length;
  console.log(length);
  return (
    <>
      <Overlay isLoading={getLoadingState} />
      <List content={content.itemsGroupedByTime} length={length} {...restProps} />
    </>
  );
});

const List = observer(({ content, itemActions, options, length, onDishesUnite }: Props) => {
  const renderItem = useCallback(
    (item: DayScheduleItemUI) => {
      return <Item key={item.id} content={item} itemActions={itemActions} options={options} />;
    },
    [itemActions]
  );

  console.log('from list');
  return (
    <ul className={styles.list}>
      {content.map((group) => (
        <TimeGroup key={group.time} group={group} onUnite={onDishesUnite} options={options}>
          {renderItem}
        </TimeGroup>
      ))}
    </ul>
  );
});

export default ListWrapper;

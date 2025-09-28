import { observer } from 'mobx-react-lite';
import styles from './ListItem.module.scss';
import commonListStyles from '@/components/blocks/builders/food/shared/ui/CommonListItem/CommonListItem.module.scss';
import listItemStyles from '../../../List/Item/Item.module.scss';
import { DayScheduleItemUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import clsx from 'clsx';

type Props = {
  children?: React.ReactNode;
  item: DayScheduleItemUI;
  store: {
    isSelected: (id: string | number) => boolean;
    select: (item: DayScheduleItemUI, value?: boolean) => void;
  };
};

const ListItem = ({ item, store }: Props) => {
  const onClick = () => {
    store.select(item);
  };

  const isSelected = store.isSelected(item.id);

  return (
    <li
      key={item.id}
      className={clsx([
        listItemStyles.group,
        isSelected && styles.active,
        commonListStyles.container,
      ])}
      onClick={onClick}
    >
      <span>{item.time}</span>
      <span>{item.food?.name}</span>
      <span>{item.quantity}</span>
    </li>
  );
};

export default observer(ListItem);

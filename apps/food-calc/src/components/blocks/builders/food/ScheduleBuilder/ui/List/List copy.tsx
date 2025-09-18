import { observer } from 'mobx-react-lite';
import styles from './List.module.scss';
import { DayScheduleItemUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { ListItem } from '@/components/blocks/builders/food/shared/ui/CommonListItem';
import { BuilderUIStore } from '@/components/blocks/builders/food/shared/BuilderUIStore';
import clsx from 'clsx';
import { FoodName } from '@/components/blocks/builders/food/shared/ui/FoodName';
import { Time } from './Time';

const isSameTimeAsPrevious = (items: { time: string }[], index: number, time: string) => {
  return items[index - 1]?.time === time;
};

const isSameTimeAsNext = (items: { time: string }[], index: number, time: string) => {
  return items[index + 1]?.time === time;
};

const getTimeDifferenceWithPrevious = (
  items: { time: string }[],
  index: number,
  time: string
): string | null => {
  if (index === 0 || !items[index - 1]) return null;

  const previousTime = items[index - 1].time;

  const toMinutes = (t: string) => {
    const [hours, minutes] = t.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const diffMinutes = toMinutes(time) - toMinutes(previousTime);

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  const minutesView = minutes > 0 ? minutes + ' мин. ' : '';
  const hoursView = hours > 0 ? hours + ' ч. ' : '';

  return `${hoursView}${minutesView}`;
};

type Props = {
  content: {
    scheduleItemsSorted: DayScheduleItemUI[];
    deleteChild: (id: string | number) => void;
    recoverDeletedChild: (id: string | number) => void;
  };
  options: BuilderUIStore;
  onDishCreate: (time: string) => void;
  onTitle: (id: string | number) => void;
  onTitleInfoMode: (id: string | number) => void;
  onTime: (id: string | number) => void;
  onQuantity: (id: string | number) => void;
};

const List = ({
  content,
  options,
  onDishCreate,
  onTitle,
  onTime,
  onQuantity,
  onTitleInfoMode,
}: Props) => {
  const onUniteButtonClick = (e, time: string) => {
    e?.stopPropagation();
    onDishCreate(time);
  };

  const { deleteChild, recoverDeletedChild } = content;

  return (
    <ul className={styles.list}>
      {content.scheduleItemsSorted.map(
        (
          { id, food = null, quantity, time, customFoodName = '', dish = null, status = null },
          index,
          items
        ) => {
          const notSameTimeAsPrevious = !isSameTimeAsPrevious(items, index, time);
          const sameTimeAsNext = isSameTimeAsNext(items, index, time);
          const timeDifference = getTimeDifferenceWithPrevious(items, index, time);
          return (
            <li>
              {console.log('listtt')}
              <Time onClick={onTime} id={id}>
                {time || '00:00'}
              </Time>
            </li>

            // <ListItem
            //   status={status}
            //   options={options}
            //   onDelete={deleteChild}
            //   onRecover={recoverDeletedChild}
            //   id={id}
            //   key={id}
            //   className={clsx([
            //     dish && styles.listItem_dish,
            //     notSameTimeAsPrevious && styles.listItem_lined,
            //     sameTimeAsNext && styles.listItem_noShadow,
            //   ])}
            // >
            //   {console.log('listtt')}
            //   <Time onClick={onTime} id={id}>
            //     {time || '00:00'}
            //   </Time>
            //   <p>
            //     <span
            //       className={clsx([styles.listItemTopBlock, styles.listItemMessage])}
            //       hidden={!timeDifference}
            //     >
            //       {timeDifference}
            //     </span>
            //     <FoodName
            //       id={id}
            //       hintMode={options.showAdditionals}
            //       onClick={onTitle}
            //       onClickHintModeOn={onTitleInfoMode}
            //     >
            //       {food ? food.name : dish ? dish.name : customFoodName}
            //     </FoodName>
            //     <span
            //       onClick={(e) => onUniteButtonClick(e, time)}
            //       className={clsx([styles.listItemTopBlock, styles.listItemTopBlock_right])}
            //       hidden={!timeDifference}
            //     >
            //       обьединить в блюдо
            //     </span>
            //   </p>
            //   <p onClick={() => onQuantity(id)}>{quantity}</p>
            // </ListItem>
          );
        }
      )}
    </ul>
  );
};

export default observer(List);

import { useEffect, useMemo, useRef } from 'react';
import { ScheduleBuilderViewModel, Suggestion } from './model/ScheduleBuilderViewModel';
import { observer } from 'mobx-react-lite';
import style from './ScheduleBuilder.module.scss';
import { toJS } from 'mobx';
import { Suggestions } from '@/components/blocks/ScheduleBuilder/ScheduleBuilderSuggestions';
import clsx from 'clsx';

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

const ScheduleBuilder = () => {
  const vm = useMemo(() => new ScheduleBuilderViewModel(), []);

  useEffect(() => {
    console.log(toJS(vm.currentScheduleItem));
  }, [vm.currentScheduleItem]);

  return (
    <div className={style.container}>
      <ul className={style.list}>
        {vm.scheduleItemsSorted.map(({ id, foodName, quantity, time }, index, items) => {
          const notSameTimeAsPrevious = !isSameTimeAsPrevious(items, index, time);
          const sameTimeAsNext = isSameTimeAsNext(items, index, time);
          return (
            <li
              key={id}
              className={clsx([
                style.listItem,
                notSameTimeAsPrevious && style.listItem_lined,
                sameTimeAsNext && style.listItem_noShadow,
              ])}
              onClick={() => vm.setCurrentScheduleItemId(id)}
            >
              <p
                onClick={() => vm.setCurrentSuggestion(Suggestion.Time)}
                className={style.listItemTime}
              >
                {time || '00:00'}
              </p>
              <p onClick={() => vm.setCurrentSuggestion(Suggestion.Food)}>
                <span className={style.listItemMessage} hidden={!notSameTimeAsPrevious}>
                  {getTimeDifferenceWithPrevious(items, index, time)}
                </span>
                {foodName}
              </p>
              <p onClick={() => vm.setCurrentSuggestion(Suggestion.Quantity)}>{quantity}</p>
            </li>
          );
        })}
      </ul>
      {vm.currentSuggestion === Suggestion.Food && <Suggestions.Food vm={vm} />}
      {vm.currentSuggestion === Suggestion.Time && <Suggestions.Time vm={vm} />}
      {vm.currentSuggestion === Suggestion.Quantity && <Suggestions.Quantity vm={vm} />}

      <button onClick={vm.onScheduleItemAddHandler} className={style.addButton}>
        +
      </button>
    </div>
  );
};

export default observer(ScheduleBuilder);

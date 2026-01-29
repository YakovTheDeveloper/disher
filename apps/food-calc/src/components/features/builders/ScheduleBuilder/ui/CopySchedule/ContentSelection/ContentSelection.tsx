import { observer, useLocalObservable } from 'mobx-react-lite';
import styles from './ContentSelection.module.scss';
import {
  DayScheduleItemCopyPayloadUI,
  DayScheduleItemUI,
  TimeGroupUI,
} from '@/components/features/builders/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { InitLoadingStore } from '@/components/features/builders/ScheduleBuilder/model/InitLoadingStore';
import { debounce } from '@/lib/debounce';
import { useMemo, useEffect, useCallback } from 'react';
import { ISODate } from '@/types/common/common';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { ListItem } from './ListItem';
import { useSelectStore } from '@/components/features/builders/ScheduleBuilder/ui/CopySchedule/ContentSelection/useSelectStore';
import { Actions } from '@/components/features/builders/shared/ui/Actions';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';

type Props = {
  children?: React.ReactNode;
  onFinish: (items: DayScheduleItemUI[]) => void;
  date: ISODate;
};

const ContentSelection = ({ date, onFinish }: Props) => {
  const store = useMemo(() => new InitLoadingStore(), []);
  const items = useMemo(() => store.initData?.itemsGroupedByTime || null, [store.initData]);

  const selectStore = useSelectStore();

  const onInit = useMemo(
    () =>
      debounce((date: string) => {
        store.onInit(date);
      }, 500),
    [store]
  );

  useEffect(() => {
    store.reset();
    onInit(date);

    return () => {
      onInit.cancel();
    };
  }, [date, onInit]);

  const renderItem = useCallback((item: DayScheduleItemUI) => {
    return <ListItem key={item.id} item={item} store={selectStore} />;
  }, []);

  const onFinishButtonClick = () => onFinish(selectStore.getResult());

  const renderAside = useCallback(
    (group: TimeGroupUI) => (
      <button onClick={() => selectStore.selectAllWithDate(group)}>вся группа</button>
    ),
    [selectStore]
  );

  return (
    <div className={styles.container}>
      <h2>Выберите</h2>
      {items && (
        <ul className={styles.list}>
          {items.map((group) => (
            <TimeGroup key={group.time} group={group} renderAside={renderAside}>
              {renderItem}
            </TimeGroup>
          ))}
        </ul>
      )}
      <Actions isShow={() => true}>
        <Buttons.Finish
          onClick={onFinishButtonClick}
          content={{
            itemsLength: selectStore.content.size,
          }}
        >
          Скопировать
        </Buttons.Finish>
      </Actions>
    </div>
  );
};

export default observer(ContentSelection);

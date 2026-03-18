import { observer } from 'mobx-react-lite';
import styles from './ContentSelection.module.scss';
// TODO: migrate to Triplit — ScheduleBuilderViewModel was removed
// import {
//   DayScheduleItemUI,
//   TimeGroupUI,
// } from '@/components/features/builders/ScheduleBuilder/model/ScheduleBuilderViewModel';
// TODO: migrate to Triplit — InitLoadingStore was removed
// import { InitLoadingStore } from '@/components/features/builders/ScheduleBuilder/model/InitLoadingStore';
import { useEffect, useCallback } from 'react';
import { ISODate } from '@/types/common/common';
import { TimeGroup } from '@/components/features/builders/ScheduleBuilder/components/List/TimeGroup';
import { ListItem } from './ListItem';
import { useSelectStore } from '@/components/features/builders/ScheduleBuilder/ui/CopySchedule/ContentSelection/useSelectStore';
import { Actions } from '@/components/features/builders/shared/ui/Actions';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';

// TODO: migrate to Triplit — replace DayScheduleItemUI / TimeGroupUI with Triplit entity types
type DayScheduleItemUI = any;
type TimeGroupUI = any;

type Props = {
  children?: React.ReactNode;
  onFinish: (items: DayScheduleItemUI[]) => void;
  date: ISODate;
};

const ContentSelection = ({ date, onFinish }: Props) => {
  // TODO: migrate to Triplit — InitLoadingStore was removed, use Triplit queries instead
  // const store = useMemo(() => new InitLoadingStore(), []);
  // const items = useMemo(() => store.initData?.itemsGroupedByTime || null, [store.initData]);
  const items: TimeGroupUI[] | null = null as TimeGroupUI[] | null;

  const selectStore = useSelectStore();

  useEffect(() => {
    // TODO: migrate to Triplit — trigger data loading via Triplit query
    void date;
  }, [date]);

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
          {items.map((group: TimeGroupUI) => (
            <TimeGroup key={group.time} group={group} renderAside={renderAside}>
              <>{group.items?.map((item: DayScheduleItemUI) => renderItem(item))}</>
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

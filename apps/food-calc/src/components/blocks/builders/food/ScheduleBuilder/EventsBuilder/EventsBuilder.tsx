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

type Props = {
  children?: React.ReactNode;
  vm: DayEventsBuilderViewModel;
  onEventContentUpdateModalOpen: (id: string | number) => void;
  onEventContentCreateModalOpen: () => void;
  onEventTimeModalOpen: (id: string | number) => void;
};

const EventsBuilder = ({
  vm,
  onEventContentUpdateModalOpen,
  onEventContentCreateModalOpen,
  onEventTimeModalOpen,
}: Props) => {
  const options = useMemo(() => new BuilderUIStore(), []);

  const onFinishHandler = useCallback(() => {
    // onFinish(vm.payload());
  }, [vm]);

  const renderEventListItem = useCallback((item: ScheduleQuestionnaireItemUI) => {
    return (
      <CommonListItem
        className={styles.listItemRow}
        id={item.id}
        onDelete={vm.children.deleteChild}
        onRecover={vm.children.recoverDeletedChild}
        key={item.id}
        status={item.status}
        showAdditionals={options.showAdditionals}
      >
        <EventListItem
          item={item}
          onContentModalOpen={onEventContentUpdateModalOpen}
          onTimeModalOpen={onEventTimeModalOpen}
        />
      </CommonListItem>
    );
  }, []);

  return (
    <>
      <section className="builder__time-groups">
        {vm.itemsGroupedByTime.map((timeGroup) => (
          <TimeGroup key={timeGroup.time} group={timeGroup}>
            {renderEventListItem}
          </TimeGroup>
        ))}
      </section>
      <Actions isShow={() => true}>
        <ActionButton.Finish onClick={onFinishHandler} content={vm}>
          обновить
        </ActionButton.Finish>
        <ActionButton.Add onClick={onEventContentCreateModalOpen} />
        <ActionButton.AdditionalOptions options={options} />
      </Actions>
    </>
  );
};

export default observer(EventsBuilder);

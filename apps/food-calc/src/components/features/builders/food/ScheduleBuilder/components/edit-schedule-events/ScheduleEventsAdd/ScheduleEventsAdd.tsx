import { observer } from 'mobx-react-lite';
import styles from './ScheduleEventsAdd.module.scss';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { useState, useMemo, lazy } from 'react'; // Import useCallback
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import clsx from 'clsx';
import { mstEnv } from '@/store/store';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
// import { EventContent } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent';
import {
  useItemCreationSteps,
  useTabs,
} from '@/components/features/builders/food/shared/hooks/useTabs';
import { SchheduleEventList } from '@/components/features/builders/food/ScheduleBuilder/components/edit-schedule-events/components/SchheduleEventList';
import { EventItem } from '@/domain/schedule/scheduleEvent/scheduleEvent';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { useSchedule } from '@/components/features/builders/food/ScheduleBuilder/context';

const EventContent = lazy(() =>
  import(
    '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent'
  ).then((module) => ({
    default: module.EventContent,
  }))
);

type Props = {
  close: () => void;
};

const ScheduleEventsAdd = ({ close }: Props) => {
  const schedule = useSchedule();

  // const currentChild = schedule.draft.food;
  const currentChild = useMemo(
    () =>
      EventItem.create(
        {
          id: 'draft-event',
          value: '',
          time: schedule.lastTimeEventAdded || '12:00',
          type: 'custom',
        },
        mstEnv
      ),
    []
  );
  const onFinish = () => {
    schedule.addDraftToEvents(currentChild);
    close();
  };

  const tabs = [
    {
      value: 'time',
      label: 'Время',
      alternativeLabel: currentChild.time || '00:00',
      disabled: false,
    },
    {
      value: 'eventSelect',
      label: 'Вариант',
      alternativeLabel: currentChild.typeView,
      disabled: !currentChild.type,
    },
    {
      value: 'value',
      label: 'Количество',
      alternativeLabel: currentChild.value || '',
      disabled: false,
    },
  ];

  const { currentTab, goNext, setTab } = useTabs(tabs);

  return (
    <DrawerLayout
      label={<ScreenLabel>Добавить</ScreenLabel>}
      tabs={<Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleEventAdd" />}
      topRight={<FinishButton onClick={onFinish} />}
    >
      {currentTab === 'time' && <ContentEdit.Time item={currentChild} onFinish={goNext} />}
      {currentTab === 'eventSelect' && (
        <SchheduleEventList eventItem={currentChild} onFinish={goNext} />
      )}
      {currentTab === 'value' && <EventContent onFinish={goNext} currentEvent={currentChild} />}
      <Spacer variant="drawer-footer-offset" />
    </DrawerLayout>
  );
};

export default observer(ScheduleEventsAdd);

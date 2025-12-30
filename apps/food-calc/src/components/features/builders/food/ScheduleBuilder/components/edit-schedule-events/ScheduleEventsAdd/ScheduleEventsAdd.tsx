import { observer } from 'mobx-react-lite';
import styles from './ScheduleEventsAdd.module.scss';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { useState, useMemo } from 'react'; // Import useCallback
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { Tabs } from '@/components/ui/Tabs';
import clsx from 'clsx';
import { mstEnv } from '@/store/store';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { EventContent } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent';
import { useItemCreationSteps } from '@/components/features/builders/food/shared/hooks/useItemCreationSteps';
import { SchheduleEventList } from '@/components/features/builders/food/ScheduleBuilder/components/edit-schedule-events/components/SchheduleEventList';
import { EventItem } from '@/domain/schedule/scheduleEvent/scheduleEvent';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

const ScheduleEventsAdd = ({ schedule }: Props) => {
  const modals = useDailyScheduleModals();

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
    modals.close();
  };

  const tabs = [
    {
      value: 'time',
      label: 'Время',
      alternativeLabel: currentChild.time || '00:00',
    },
    {
      value: 'eventSelect',
      label: 'Вариант',
      alternativeLabel: currentChild.typeView,
    },
    {
      value: 'value',
      label: 'Количество',
      alternativeLabel: currentChild.value,
    },
  ];

  const { currentStep, visibleSteps, setStepByValue, maxStepReached, onStepFinish } =
    useItemCreationSteps(tabs, onFinish);

  return (
    <DrawerLayout
      label={<ScreenLabel>Добавить</ScreenLabel>}
      tabs={
        <Tabs
          tabs={visibleSteps}
          current={currentStep}
          setTab={setStepByValue}
          variant="scheduleEventAdd"
        />
      }
      bottom={<FinishButton maxStepReached={maxStepReached} onClick={onFinish} />}
    >
      {currentStep === 'time' && <ContentEdit.Time item={currentChild} onFinish={onStepFinish} />}
      {currentStep === 'eventSelect' && (
        <SchheduleEventList eventItem={currentChild} onFinish={onStepFinish} />
      )}
      {currentStep === 'value' && (
        <EventContent onFinish={onStepFinish} currentEvent={currentChild} />
      )}
    </DrawerLayout>
  );
};

export default observer(ScheduleEventsAdd);

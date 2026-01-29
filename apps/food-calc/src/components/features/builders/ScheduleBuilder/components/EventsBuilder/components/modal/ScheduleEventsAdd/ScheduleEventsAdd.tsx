import { observer, useLocalObservable } from 'mobx-react-lite';
import { lazy } from 'react';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import ModalLayout from '@/components/features/builders/shared/components/ModalLayout/ModalLayout';
import { WizardStep } from '@/components/features/builders/shared/components/WizardStep';
import { FinishButton } from '@/components/features/builders/shared/atoms/FinishButton';
import { SchheduleEventList } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/modal/ScheduleEventsAdd/components/SchheduleEventList';
import {
  useDraftEventScheduleItem,
  useSchedule,
  useSelectedEventItem,
} from '@/components/features/builders/ScheduleBuilder/context';
import { useEntityItemWizard } from '@/components/features/builders/shared/hooks/useEntityItemWizard';

const EventContent = lazy(() =>
  import(
    '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent'
  ).then((module) => ({
    default: module.EventContent,
  }))
);

type Props = {
  close: () => void;
  variant: 'add' | 'edit';
  defaultTab?: string;
};

const ScheduleEventsAdd = ({ close, variant, defaultTab }: Props) => {
  const schedule = useSchedule();

  const hook = variant === 'add' ? useDraftEventScheduleItem : useSelectedEventItem;

  const currentChild = hook();

  const timeState = useLocalObservable(() => ({
    localTime: currentChild.time,
    handleTimeUpdate(newTime: string) {
      this.localTime = newTime;
      currentChild.updateTime(newTime);
    },
  }));

  const baseTabs = [
    {
      value: 'time' as const,
      label: 'Время',
      alternativeLabel: currentChild.time || '00:00',
    },
    {
      value: 'eventSelect' as const,
      label: 'Вариант',
      alternativeLabel: currentChild.type,
    },
    {
      value: 'value' as const,
      label: 'Количество',
      alternativeLabel: currentChild.value || '',
    },
  ];

  const { searchFocusState, currentTab, direction, setTab, handleFinish, handleNextStep } =
    useEntityItemWizard(variant, {
      baseTabs,
      onFinish: () => {
        return schedule.addDraftToEvents();
      },
      onAfterFinish: () => close(),
    });

  const tabs =
    variant === 'edit'
      ? [{ value: 'info' as const, label: 'info', alternativeLabel: '' }, ...baseTabs]
      : baseTabs;

  const handleTabChange = (tab: string) => setTab(tab as 'time' | 'eventSelect' | 'value' | 'info');

  return (
    <ModalLayout
      footer={
        <Tabs
          tabs={tabs}
          current={currentTab}
          setTab={handleTabChange}
          variant="scheduleEventAdd"
          onFinish={handleFinish}
        />
      }
      topRight={<FinishButton onClick={handleFinish} />}
      showHeader={!searchFocusState.isSearchFocused}
    >
      <WizardStep stepKey={currentTab} direction={direction}>
        {currentTab === 'info' && <div>инфа</div>}
        {currentTab === 'time' && (
          <ContentEdit.Time item={currentChild} timeState={timeState} onFinish={handleNextStep} />
        )}
        {currentTab === 'eventSelect' && (
          <SchheduleEventList eventItem={currentChild} onFinish={handleNextStep} />
        )}
        {currentTab === 'value' && (
          <EventContent onFinish={handleNextStep} currentEvent={currentChild} />
        )}
      </WizardStep>
    </ModalLayout>
  );
};

export default observer(ScheduleEventsAdd);

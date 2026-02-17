import { observer, useLocalObservable } from 'mobx-react-lite';
import { lazy } from 'react';
import { domainStore } from '@/store/store';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import ModalLayout from '@/components/features/builders/shared/components/ModalLayout/ModalLayout';
import { WizardStep } from '@/components/features/builders/shared/components/WizardStep';
import { FinishButton } from '@/components/features/builders/shared/atoms/FinishButton';
import {
  useDraftEventScheduleItem,
  useSchedule,
  useSelectedEventItem,
} from '@/components/features/builders/ScheduleBuilder/context';
import { useEntityItemWizard } from '@/components/features/builders/shared/hooks/useEntityItemWizard';
import EventContentV2 from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent/EventContentV2';
import { ScheduleEventCategoryList } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/modal/ScheduleEventsAdd/components/ScheduleEventCategoryList';
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();

  const currentChild = variant === 'add' ? useDraftEventScheduleItem() : useSelectedEventItem();

  const timeState = useLocalObservable(() => ({
    localTime: currentChild.time,
    handleTimeUpdate(newTime: string) {
      this.localTime = newTime;
      currentChild.updateTime(newTime);
    },
  }));

  const typeTextView = t('event.' + currentChild.type);

  const baseTabs = [
    {
      value: 'time' as const,
      label: 'Время',
      alternativeLabel: currentChild.time || '00:00',
    },
    {
      value: 'eventSelect' as const,
      label: 'Вариант',
      alternativeLabel: typeTextView,
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
        return domainStore.scheduleStore.commitEventDraft(schedule);
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
      showCloseButton
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
          <ContentEdit.Time timeState={timeState} onFinish={handleNextStep} />
        )}
        {currentTab === 'eventSelect' && (
          <ScheduleEventCategoryList eventItem={currentChild} onFinish={handleNextStep} />
        )}
        {currentTab === 'value' && (
          <EventContentV2 onFinish={handleNextStep} currentEvent={currentChild} />
          // <EventContent onFinish={handleNextStep} currentEvent={currentChild} />
        )}
      </WizardStep>
    </ModalLayout>
  );
};

export default observer(ScheduleEventsAdd);

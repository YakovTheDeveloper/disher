import { observer } from 'mobx-react-lite';
import { lazy } from 'react';
import styles from './ScheduleEventsEdit.module.scss';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { Tabs } from '@/components/ui/Tabs';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { useSelectedEventItem } from '@/components/features/builders/food/ScheduleBuilder/context';
import { SchheduleEventList } from '@/components/features/builders/food/ScheduleBuilder/components/edit-schedule-events/components/SchheduleEventList';

const EventContent = lazy(() =>
  import(
    '@/components/features/builders/food/ScheduleBuilder/EventsBuilder/components/EventContent'
  ).then((module) => ({
    default: module.EventContent,
  }))
);

type Props = {
  defaultTab?: string;
  close: () => void;
};

const tabs = [
  { value: 'time', label: 'время' },
  { value: 'eventChange', label: 'событие' },
  { value: 'value', label: 'значение' },
];

const ScheduleEventsEdit = observer(({ defaultTab, close }: Props) => {
  const child = useSelectedEventItem();
  const { currentTab, setTab } = useTabs(tabs, defaultTab);

  return (
    <DrawerLayout
      label={
        <ScreenLabel className={styles.title} variant="drawer">
          Изменить событие
        </ScreenLabel>
      }
      tabs={<Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodEdit" />}
    >
      {currentTab === 'time' && <ContentEdit.Time item={child} onFinish={close} />}
      {currentTab === 'eventChange' && <SchheduleEventList eventItem={child} onFinish={() => {}} />}
      {currentTab === 'value' && <EventContent onFinish={() => {}} currentEvent={child} />}
      <Spacer variant="drawer-footer-offset" />
    </DrawerLayout>
  );
});

export default ScheduleEventsEdit;

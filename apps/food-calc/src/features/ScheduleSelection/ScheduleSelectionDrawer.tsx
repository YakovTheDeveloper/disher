import { useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { Tabs } from '@/shared/ui/Tabs';
import type { Tab } from '@/shared/ui/Tabs';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ScheduleSelection } from './ScheduleSelection';
import { SchedulePeriods } from './SchedulePeriods';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

const tabs: Tab[] = [
  { value: 'calendar', alternativeLabel: 'Календарь' },
  { value: 'periods', alternativeLabel: 'Периоды' },
];

export const ScheduleSelectionDrawer = ({ onClose, selectedDate }: Props) => {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <DrawerLayout>
      <div style={{ height: '90dvh', display: 'flex', flexDirection: 'column' }}>
        <Tabs tabs={tabs} current={activeTab} setTab={setActiveTab} />
        {activeTab === 'calendar' && (
          <ScheduleSelection selectedDate={selectedDate} onSelect={(date) => onClose(date)} />
        )}
        {activeTab === 'periods' && <SchedulePeriods />}
      </div>
    </DrawerLayout>
  );
};

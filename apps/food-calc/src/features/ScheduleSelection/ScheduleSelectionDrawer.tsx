import { useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { Tabs } from '@/shared/ui/Tabs';
import type { Tab } from '@/shared/ui/Tabs';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ScheduleSelection } from './ScheduleSelection';
import { SchedulePeriods } from './SchedulePeriods';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
  initialTab?: 'calendar' | 'periods';
}

const tabs: Tab[] = [
  { value: 'calendar', alternativeLabel: 'Календарь' },
  { value: 'periods', alternativeLabel: 'Периоды' },
];

export const ScheduleSelectionDrawer = ({ onClose, selectedDate, initialTab }: Props) => {
  const [activeTab, setActiveTab] = useState(initialTab ?? 'calendar');

  return (
    <DrawerLayout>
      <div style={{ height: '90dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {activeTab === 'calendar' && (
            <ScheduleSelection selectedDate={selectedDate} onSelect={(date) => onClose(date)} />
          )}
          {activeTab === 'periods' && <SchedulePeriods />}
        </div>
        <Tabs tabs={tabs} current={activeTab} setTab={(v) => setActiveTab(v as 'calendar' | 'periods')} />
      </div>
    </DrawerLayout>
  );
};

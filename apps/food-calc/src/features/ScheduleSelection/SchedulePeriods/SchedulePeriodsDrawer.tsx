import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { SchedulePeriods } from './SchedulePeriods';

interface Props extends BaseDrawerProps {
  date: string;
}

export const SchedulePeriodsDrawer = ({ date, onClose }: Props) => (
  <DrawerLayout>
    <div style={{ height: '90dvh', display: 'flex', flexDirection: 'column' }}>
      <SchedulePeriods date={date} onClose={onClose} />
    </div>
  </DrawerLayout>
);

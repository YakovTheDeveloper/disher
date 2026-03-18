import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import { ScheduleSelection } from './ScheduleSelection';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

export const ScheduleSelectionDrawer = ({ onClose, selectedDate }: Props) => {
  return (
    <DrawerLayout>
      <div style={{ height: '50dvh' }}>
        <ScheduleSelection
          selectedDate={selectedDate}
          onSelect={(date) => onClose(date)}
        />
      </div>
    </DrawerLayout>
  );
};

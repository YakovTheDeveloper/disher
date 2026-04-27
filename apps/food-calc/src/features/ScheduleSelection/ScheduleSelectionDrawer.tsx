import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ScheduleSelection } from './ScheduleSelection';
import s from './ScheduleSelectionDrawer.module.scss';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

export const ScheduleSelectionDrawer = ({ onClose, selectedDate }: Props) => {
  return (
    <DrawerLayout>
      <div className={s.shell}>
        <div className={s.content}>
          <ScheduleSelection selectedDate={selectedDate} onSelect={(date) => onClose(date)} />
        </div>
      </div>
    </DrawerLayout>
  );
};

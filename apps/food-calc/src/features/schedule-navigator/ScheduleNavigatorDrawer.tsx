import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ScheduleNavigator } from './ScheduleNavigator';
import s from './ScheduleNavigatorDrawer.module.scss';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

export const ScheduleNavigatorDrawer = ({ onClose, selectedDate }: Props) => {
  return (
    <DrawerLayout a11yLabel="Выбор даты">
      <div className={s.shell}>
        <ScheduleNavigator selectedDate={selectedDate} onSelect={(date) => onClose(date)} />
      </div>
    </DrawerLayout>
  );
};

export default ScheduleNavigatorDrawer;

import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ScheduleNavigator } from './ScheduleNavigator';
import s from './ScheduleNavigatorDrawer.module.scss';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

export const ScheduleNavigatorDrawer = ({ onClose, selectedDate }: Props) => {
  return (
    // No visible title — the tab construction inside (active label «Навигация» /
    // «Активные дни») IS the heading. We keep the chrome row (× close in the
    // corner) and pass the title only as the sr-only accessible name.
    <DrawerLayout a11yLabel="Активность">
      <div className={s.shell}>
        <ScheduleNavigator selectedDate={selectedDate} onSelect={(date) => onClose(date)} />
      </div>
    </DrawerLayout>
  );
};

export default ScheduleNavigatorDrawer;

import { useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ScheduleNavigator } from './ScheduleNavigator';
import s from './ScheduleNavigatorDrawer.module.scss';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

export const ScheduleNavigatorDrawer = ({ onClose, selectedDate }: Props) => {
  // The tab construction («Навигация / Активные дни») IS the header. It rides
  // DrawerLayout's `header` slot (the chrome row) via a portal: we hand the slot
  // an empty host div and ScheduleNavigator portals its tab row into it. So the
  // Close cross keeps its proper chrome-row corner, the tabs center in the
  // symmetric header band (cleared of the cross), and the body carries only the
  // panels — instead of the tabs floating crookedly over the body content.
  const [tabHost, setTabHost] = useState<HTMLDivElement | null>(null);

  return (
    <DrawerLayout
      a11yLabel="Активность"
      header={<div ref={setTabHost} className={s.tabHost} />}
      // Полноэкранные панели навигатора несут свою кромку — боковой инсет тела
      // выключаем (default нижнего дровера = 24 иначе поджал бы табы/панели).
      contentInset="none"
    >
      <div className={s.shell}>
        <ScheduleNavigator
          align="center"
          tabPortal={tabHost}
          selectedDate={selectedDate}
          onSelect={(date) => onClose(date)}
        />
      </div>
    </DrawerLayout>
  );
};

export default ScheduleNavigatorDrawer;

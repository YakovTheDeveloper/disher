import { DateChoose } from '@/components/features/builders/food/ScheduleBuilder/components/DateChoose';
import { ScheduleDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { DrawerDefinition, DrawerContext } from '@/types/common/drawer';

export interface ScheduleDrawerPayloads {
  [ScheduleDrawers.DateChoose]: void;
}

export const scheduleDrawers: readonly DrawerDefinition<any>[] = [
  {
    type: ScheduleDrawers.DateChoose,
    render: (ctx: DrawerContext) => <DateChoose close={ctx.close} />,
  },
];

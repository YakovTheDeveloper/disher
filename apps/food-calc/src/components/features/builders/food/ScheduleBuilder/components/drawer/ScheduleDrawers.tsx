import { DateChoose } from '@/components/features/builders/food/ScheduleBuilder/components/DateChoose';
import { ScheduleEventsAdd } from '@/components/features/builders/food/ScheduleBuilder/components/edit-schedule-events/ScheduleEventsAdd';
import { ScheduleEventsEdit } from '@/components/features/builders/food/ScheduleBuilder/components/edit-schedule-events/ScheduleEventsEdit';
import { ScheduleFoodAdd } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/ScheduleFoodAdd';
import { ScheduleFoodEdit } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/ScheduleFoodEdit';
import {
  DraftScheduleItemProvider,
  SelectedEventItemProvider,
  SelectedScheduleItemProvider,
} from '@/components/features/builders/food/ScheduleBuilder/context/ScheduleChildProvider';
import ScheduleProvider from '@/components/features/builders/food/ScheduleBuilder/context/ScheduleProvider';
import {
  EventEditDrawer,
  FoodEditDrawer,
  ScheduleDrawers,
} from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { DrawerDefinition, DrawerContext } from '@/types/common/drawer';
import { SnapshotIn } from 'mobx-state-tree';

export interface ScheduleDrawerPayloads {
  [ScheduleDrawers.DateChoose]: void;

  [ScheduleDrawers.FoodAdd]: void;

  [ScheduleDrawers.FoodEdit]: {
    defaultTab: 'foodChange' | 'time' | 'quantity';
  };

  [ScheduleDrawers.EventAdd]: void;
  [ScheduleDrawers.EventEdit]: {
    defaultTab: 'content' | 'time' | 'value';
  };
}

export const scheduleDrawers: readonly DrawerDefinition<any>[] = [
  {
    type: ScheduleDrawers.DateChoose,
    render: (ctx: DrawerContext) => <DateChoose close={ctx.close} />,
  },

  {
    type: ScheduleDrawers.FoodAdd,
    render: (ctx: DrawerContext) => (
      <ScheduleProvider>
        <DraftScheduleItemProvider>
          <ScheduleFoodAdd variant="add" close={ctx.close} />
        </DraftScheduleItemProvider>
      </ScheduleProvider>
    ),
  },

  {
    type: ScheduleDrawers.FoodEdit,
    render: (ctx: SnapshotIn<typeof FoodEditDrawer>) => (
      <ScheduleProvider>
        <SelectedScheduleItemProvider itemId={ctx.payload.itemToEditId}>
          <ScheduleFoodAdd variant="edit" defaultTab={ctx.payload.defaultTab} close={ctx.close} />
        </SelectedScheduleItemProvider>
      </ScheduleProvider>
    ),
  },

  {
    type: ScheduleDrawers.EventAdd,
    render: (ctx: DrawerContext) => (
      <ScheduleProvider>
        <ScheduleEventsAdd close={ctx.close} />
      </ScheduleProvider>
    ),
  },

  {
    type: ScheduleDrawers.EventEdit,
    render: (ctx: SnapshotIn<typeof EventEditDrawer>) => (
      <ScheduleProvider>
        <SelectedEventItemProvider itemId={ctx.payload.itemToEditId}>
          <ScheduleEventsEdit defaultTab={ctx.payload.defaultTab} close={ctx.close} />
        </SelectedEventItemProvider>
      </ScheduleProvider>
    ),
  },
];

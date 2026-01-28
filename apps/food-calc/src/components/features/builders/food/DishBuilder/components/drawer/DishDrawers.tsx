import DishAddDrawer from '@/components/features/drawers/DishAddDrawer/DishAddDrawer';
import { DishDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { DrawerDefinition, DrawerContext } from '@/types/common/drawer';

export interface DishDrawerPayloads {
  [DishDrawers.Add]: void;
}

export const dishDrawers: readonly DrawerDefinition<any>[] = [
  {
    type: DishDrawers.Add,
    render: (ctx: DrawerContext) => <DishAddDrawer close={ctx.close} />,
  },
];

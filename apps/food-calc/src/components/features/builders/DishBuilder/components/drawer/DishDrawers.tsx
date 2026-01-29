import FoodAddDrawer from '@/components/features/shared/drawers/FoodAddDrawer/FoodAddDrawer';
import { DishDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { DrawerDefinition, DrawerContext } from '@/types/common/drawer';

export interface DishDrawerPayloads {
  [DishDrawers.Add]: void;
}

export const dishDrawers: readonly DrawerDefinition<any>[] = [
  {
    type: DishDrawers.Add,
    render: (ctx: DrawerContext) => <FoodAddDrawer close={ctx.close} defaultTab="dish" />,
  },
];

import FoodAddDrawer from './FoodAddDrawer/FoodAddDrawer';
import { DrawerDefinition } from '@/types/common/drawer';
import { ProductDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';

export interface ProductDrawerPayloads {
  [ProductDrawers.Add]: void;
}

export const productDrawers: readonly DrawerDefinition<any>[] = [
  {
    type: ProductDrawers.Add,
    render: (ctx) => <FoodAddDrawer close={ctx.close} />,
  },
];

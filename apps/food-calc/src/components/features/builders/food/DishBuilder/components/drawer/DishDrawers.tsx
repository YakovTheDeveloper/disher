import { DishFoodAdd } from '@/components/features/builders/food/DishBuilder/components/drawer/dish-food-actions/DishFoodAdd';
import { DishFoodEdit } from '@/components/features/builders/food/DishBuilder/components/drawer/dish-food-actions/DishFoodEdit';
import {
  DishProvider,
  SelectedDishItemProvider,
} from '@/components/features/builders/food/DishBuilder/context';
import { DishDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { DrawerDefinition, DrawerContext } from '@/types/common/drawer';

export interface DishDrawerPayloads {
  [DishDrawers.FoodAdd]: void;

  [DishDrawers.FoodEdit]: {
    defaultTab: 'content' | 'quantity';
    itemToEditId: string;
  };
}

export const dishDrawers: readonly DrawerDefinition<any>[] = [
  {
    type: DishDrawers.FoodAdd,
    render: (ctx: DrawerContext) => (
      <DishProvider>
        <DishFoodAdd close={ctx.close} />
      </DishProvider>
    ),
  },

  {
    type: DishDrawers.FoodEdit,
    render: (ctx: DrawerContext<DishDrawerPayloads[typeof DishDrawers.FoodEdit]>) => (
      <DishProvider>
        <SelectedDishItemProvider itemId={ctx.payload.itemToEditId}>
          <DishFoodEdit defaultTab={ctx.payload.defaultTab} close={ctx.close} />
        </SelectedDishItemProvider>
      </DishProvider>
    ),
  },
];

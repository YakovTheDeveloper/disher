import { getRoot, Instance, types } from "mobx-state-tree";
import toaster from "@/infrastructure/toaster/toaster";
import { productFactory } from "@/domain/product/Food.factory";
import { DishFactory } from "@/store/DishStore/Dish.factory";
import { InteractionsEnv } from "@/store/interactions/InteractionsService";

export const InteractionsCreate = types.optional(types.model().actions((self) => ({
    createProduct(name: string) {
        const root = getRoot(self) as InteractionsEnv;

        const createdFood = root.foodStore.insert(
            productFactory.createNewLocal({
                name,
                createdByUser: true,
            })
        );
        if (!createdFood) return;
        toaster.success('Продукт создан');
        root.drawerStore.close();
        return createdFood.id
    },
    createDish(name: string) {
        const root = getRoot(self) as InteractionsEnv;

        const createdDish = root.dishStore.insert(
            DishFactory.createNewLocal({
                name,
                description: '',
                userId: 0,
            })
        );
        if (!createdDish) return;
        toaster.success('Блюдо создано');
        root.drawerStore.close();
    },
})), {})

export type InteractionsCreateInstance = Instance<typeof InteractionsCreate>

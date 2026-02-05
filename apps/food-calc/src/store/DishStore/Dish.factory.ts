import { Dish, DishItem } from "@/domain/dish/Dish.model";
import { generateId } from "@/lib/id/generateId";
import { StoreEntityFactory } from "@/store/types/factory";
import { Instance, SnapshotIn, SnapshotOut } from "mobx-state-tree";

export const DishFactory: StoreEntityFactory<typeof Dish, SnapshotIn<typeof Dish>> & {
    createNewLocalFromScheduleProducts: (data: SnapshotOut<typeof DishItem>[]) => Instance<typeof Dish>
} = {

    createNewLocal(data: Omit<SnapshotIn<typeof Dish>, 'id'>) {
        return Dish.create({
            ...data,
            id: generateId(),
            items: data.items,
            draft: {
                item: createDraftDishItem()
            }
        })
    },

    createFromServerData(data: SnapshotIn<typeof Dish>) {
        return Dish.create({
            ...data,
            items: data.items,
            draft: {
                item: createDraftDishItem()
            }
        })
    },

    createNewLocalFromScheduleProducts(data: SnapshotOut<typeof DishItem>[]) {
        const onlyFoodItems = data
            .filter(el => el.content.variant === 'product' && el.sync.status !== 'deleted')
            .map(el => ({
                id: el.id,
                foodId: String(el.content.foodId),
                content: {
                    variant: 'product' as const,
                    foodId: String(el.content.foodId),
                    quantity: el.content.quantity,
                },
                status: "added" as const,
            }))!;

        return Dish.create({
            name: 'Без имени',
            id: generateId(),
            userId: 0,
            items: onlyFoodItems,
            draft: {
                item: createDraftDishItem()
            }
        })

    }
}

const createDraftDishItem = (): SnapshotIn<typeof DishItem> => ({
    id: "DRAFT",
    foodId: "",
    content: {
        foodId: "",
        variant: "product" as const,
        quantity: 100
    }
})
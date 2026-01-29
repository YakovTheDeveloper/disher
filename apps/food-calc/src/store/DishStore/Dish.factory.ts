import { allNutrientsList } from "@/components/features/builders/shared/ContentInfo/Nutrients/constants";
import { Dish } from "@/domain/dish/Dish";
import { ScheduleItem } from "@/domain/schedule/schedule";
import { generateId } from "@/lib/id/generateId";
import { StoreEntityFactory } from "@/store/types/factory";
import { ISODate } from "@/types/common/common";
import { Instance, SnapshotIn, SnapshotOut } from "mobx-state-tree";

export const DishFactory: StoreEntityFactory<typeof Dish, SnapshotIn<typeof Dish>> & {
    createNewLocalFromScheduleProducts: (data: SnapshotOut<typeof ScheduleItem>[]) => Instance<typeof Dish>
} = {

    createNewLocal(data: Omit<SnapshotIn<typeof Dish>, 'id'>) {
        return Dish.create({
            ...data,
            id: generateId(),
            items: data.items,
        })
    },

    createFromServerData(data: SnapshotIn<typeof Dish>) {
        return Dish.create({
            ...data,
            items: data.items,
        })
    },

    createNewLocalFromScheduleProducts(data: SnapshotOut<typeof ScheduleItem>[]) {
        const onlyFoodItems = data
            .filter(el => el.content.variant === 'food' && el.sync.status !== 'deleted')
            .map(el => ({
                id: el.id,
                foodId: String(el.content.foodId),
                food: String(el.content.foodId),
                quantity: el.quantity,
                status: "added" as const,
            }))!;

        return Dish.create({
            name: 'Без имени',
            id: generateId(),
            userId: 0,
            items: onlyFoodItems,
        })

    }
}

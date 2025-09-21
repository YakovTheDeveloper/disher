import { noChildrenIds, noChildrenIdsIfString, NoId } from "@/api/adapters/common"
import { DayScheduleItemUI, DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel"

export const scheduleFromUI = (item: DayScheduleUI) => {
    if (item.id === -1) {
        const { id, ...rest } = item
        return {
            ...rest,
            items: noChildrenIds(item.items)
        }
    }

    return {
        ...item,
        items: noChildrenIdsIfString(item.items)
    }

}

// export const normalizeFoodAndDishIds<T,> = (item: T | NoId<T>) => {
//     const result: Omit<typeof item, 'dish' | 'food'> & { dishId?: number; foodId?: number } = {
//         ...item,
//         ...(item.dish ? { dishId: item.dish.id } : {}),
//         ...(item.food ? { foodId: item.food.id } : {}),
//     };

//     delete (result as any).dish;
//     delete (result as any).food;
//     return result;
// }

type WithDishAndFood = {
    dish: { id: number } | null
    food: { id: number } | null
}

type Normalized<T> =
    Omit<T, "dish" | "food"> & {
        dishId: number
        foodId: number
    }

export const normalizeFoodAndDishIds = <T extends WithDishAndFood>(
    item: T
): Normalized<T> => {
    const result: Normalized<T> = {
        ...item,
        ...(item.dish ? { dishId: item.dish.id } : {}),
        ...(item.food ? { foodId: item.food.id } : {}),
    }

    delete (result as any).dish
    delete (result as any).food

    return result
}
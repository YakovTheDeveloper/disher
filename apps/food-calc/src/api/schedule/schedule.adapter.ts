import { DayScheduleItemUI, DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel"
import { ScheduleEntity } from "@/store/scheduleStore/types"
import { WithoutId } from "@/types/common/utils"

// type WithoutItemIds<T> = Omit<T, "id" | "items"> & {
//     items: (Omit<T["items"][number], "id">)[];
// };

// type CreateScheduleEntity = WithoutItemIds<ScheduleEntity>;

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

type NoId<T extends { id: unknown }> = Omit<T, "id">;

function noChildrenIds<T extends { id: unknown }>(
    data: T[]
): NoId<T>[] {
    return data.map(({ id, ...rest }) => rest);
}

type NoIdIfString<T> = T extends { id: string } ? Omit<T, "id"> : T;

export function noChildrenIdsIfString<T extends { id: unknown }>(
    data: T[]
): NoIdIfString<T>[] {
    return data.map(({ id, ...rest }) => {
        if (typeof id === "string") {
            return rest as NoIdIfString<T>;
        }
        return { id, ...rest } as NoIdIfString<T>;
    });
}

export const normalizeFoodAndDishIds = (item: DayScheduleItemUI | NoId<DayScheduleItemUI>) => {
    const result: Omit<typeof item, 'dish' | 'food'> & { dishId?: number; foodId?: number } = {
        ...item,
        ...(item.dish ? { dishId: item.dish.id } : {}),
        ...(item.food ? { foodId: item.food.id } : {}),
    };

    delete (result as any).dish;
    delete (result as any).food;
    delete (result as any).status
    return result;
}
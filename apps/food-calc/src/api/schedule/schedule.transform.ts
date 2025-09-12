import { ScheduleEntity } from "@/store/scheduleStore/types";

export const mapScheduleItemsWithoutDraftIds = (items: ScheduleEntity['items']) => {
    return items.map(item => {
        const result: Omit<typeof item, 'dish' | 'food'> & { dishId?: number; foodId?: number } = {
            ...item,
            ...(item.dish ? { dishId: item.dish.id } : {}),
            ...(item.food ? { foodId: item.food.id } : {}),
        };

        delete (result as any).dish;
        delete (result as any).food;

        if (typeof item.id === 'string') {
            delete (result as any).id;
        }

        return result;
    });
};
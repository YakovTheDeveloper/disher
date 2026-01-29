import { noChildrenIds, noChildrenIdsIfString, NoId } from "@/api/adapters/common"
import { DishItemUI, DishUI } from "@/components/features/builders/DishBuilder/model/DishBuilderViewModel"
import { DishEntity } from "@/store/models/dish/types"

interface CreateDishInput extends Omit<DishEntity, 'items' | 'id'> {
    items: ReturnType<typeof dishItemFromUI>[]
}

interface UpdateDishInput extends Omit<DishEntity, 'items'> {
    items: ReturnType<typeof dishItemFromUI>[]
}

export function dishFromUI(item: DishUI, forInput: 'createDish'): CreateDishInput;
export function dishFromUI(item: DishUI, forInput: 'updateDish'): UpdateDishInput;
export function dishFromUI(item: DishUI, forInput: 'updateDish' | 'createDish') {
    if (forInput === 'createDish' && item.id === -1) {
        const { id, ...rest } = item
        return {
            ...rest,
            items: noChildrenIds(item.items).map(dishItemFromUI)
        }
    }

    return {
        ...item,
        items: noChildrenIdsIfString(item.items).map(dishItemFromUI)
    }
}

export const dishItemFromUI = (item: DishItemUI | NoId<DishItemUI>) => {
    const result: Omit<typeof item, 'dish' | 'food'> & { foodId: number } = {
        ...item,
        foodId: item.food.id,
    };
    delete (result as any).food;
    delete (result as any).status
    return result;
}
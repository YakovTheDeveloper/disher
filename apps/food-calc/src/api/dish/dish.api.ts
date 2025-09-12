import { trpc } from "@/api/trpc/trpc"
import { DishEntity } from "@/store/models/dish/types";
import { ApiInputs } from "@types";

export const mapItems = (items: DishEntity['items']) => {
    return items.map(item => {
        if (typeof item.id === 'string') {
            const { id, quantity, ...rest } = item;
            return {
                quantity,
                foodId: rest.food.id
            };
        }
        return {
            quantity: item.quantity,
            foodId: item.food.id
        };
    });
}

export const getDishes = async () => {
    return trpc.getDishes.query()
}

export const getOneDish = async (id: number) => {
    return trpc.getOneDish.query({ id })
}

export const addDish = async (data: Omit<DishEntity, 'id'>) => {
    const sanitizedItems = mapItems(data.items)

    const payload: ApiInputs.DishCreateWithoutUserInput = {
        name: data.name,
        items: {
            createMany: { data: sanitizedItems }
        }
    }
    const result = await trpc.addDish.mutate(payload);
    return result.data
}

export const updateDish = async (data: Omit<DishEntity, 'id'>, id: number) => {
    const { items, name } = data

    const sanitizedItems = mapItems(items)

    const result = await trpc.updateDish.mutate({ id, name, items: sanitizedItems });
    return result.data
}
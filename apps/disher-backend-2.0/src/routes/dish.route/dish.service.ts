import { DishZodType } from "./dish.validation";


type DishItems = DishZodType["items"];

export function getCreateItems(items?: DishItems) {
    const { create = [] } = items ?? {};

    return {
        create: create.map(i => ({
            id: i.id,
            quantity: i.quantity,
            food: { connect: { id: i.foodId } },
        })),
    };
}

export function getUpdateItems(items?: DishItems) {
    const {
        create = [],
        update = [],
        delete: del = [],
    } = items ?? {};

    return {
        create: create.map(i => ({
            id: i.id,
            quantity: i.quantity,
            food: { connect: { id: i.foodId } },
        })),
        update: update.map(i => ({
            where: { id: i.id },
            data: {
                ...(i.quantity !== undefined && { quantity: i.quantity }),
                ...(i.foodId !== undefined && { foodId: i.foodId }),
            },
        })),
        delete: del.map(id => ({ id })),
    };
}


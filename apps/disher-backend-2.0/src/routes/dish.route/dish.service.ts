import { Prisma } from "@prisma/client";
import {
    DishItemsChangesZodInput,
    DishZodType
} from "./dish.validation";

export async function syncDish(
    tx: Prisma.TransactionClient,
    dish: DishZodType
) {
    const { id, name, userId, items, isDraft } = dish;

    const { create = [], update = [], delete: del = [] } = items;

    if (isDraft) {
        // CREATE dish + nested items
        return tx.dish.create({
            data: {
                name,
                userId,

                items: {
                    create: create.map(i => ({
                        quantity: i.quantity,
                        foodId: i.foodId,
                    }))
                }
            },
            select: {
                id: true,
                name: true,
                items: true,
            }
        });
    }

    // UPDATE dish + nested items
    return tx.dish.update({
        where: { id },
        data: {
            name,
            userId,

            items: {
                create: create.map(i => ({
                    quantity: i.quantity,
                    foodId: i.foodId,
                })),
                update: update.map(i => ({
                    where: { id: i.id },
                    data: {
                        ...(i.quantity !== undefined ? { quantity: i.quantity } : {}),
                        ...(i.foodId !== undefined ? { foodId: i.foodId } : {}),
                    }
                })),
                delete: del.map(itemId => ({ id: itemId })),
            }
        },
        select: {
            id: true,
            name: true,
            items: true,
        }
    });
}

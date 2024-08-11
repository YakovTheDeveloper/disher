import { Id, IdToItem, IdToQuantity, UpdateDelta } from "common/types";

export function compareProducts(
    oldProducts: { [key: number]: number },
    newProducts: { [key: number]: number }
): UpdateDelta {
    const productsUpdated: IdToQuantity = {};
    const productsRemoved: IdToItem<boolean> = {};
    const productsCreated: IdToQuantity = {};

    for (const id in oldProducts) {
        if (newProducts.hasOwnProperty(id)) {
            if (oldProducts[id] !== newProducts[id]) {
                productsUpdated[id] = newProducts[id]
            }
        } else {
            productsRemoved[id] = true
        }
    }

    for (const id in newProducts) {
        if (!oldProducts.hasOwnProperty(id)) {
            productsCreated[id] = newProducts[id]
        }
    }

    return {
        productsUpdated,
        productsRemoved,
        productsCreated,
    };
}

type Key = "productId"

export function createProductIdToMenuProduct<Item extends {
    productId: number | string, quantity: number
}>(data: Item[], idKey: Key = 'productId') {

    const initialMenuProducts: IdToItem<Item> = {}
    const productToQuantity: IdToQuantity = {}

    for (const item of data) {
        initialMenuProducts[item[idKey]] = {
            ...item
        }
        productToQuantity[item[idKey]] = item.quantity
    }
    return {
        initialMenuProducts,
        productToQuantity
    }
}
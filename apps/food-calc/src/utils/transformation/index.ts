import { IdToQuantity } from "@/types/common/common"

export function createIdToQuantityMapping(data: { id: string, quantity: number }[]): IdToQuantity {
    return data.reduce((acc: IdToQuantity, { id, quantity }) => {
        acc[+id] = quantity;
        return acc;
    }, {});
}
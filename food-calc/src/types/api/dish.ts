import { IdToQuantity } from "@/types/common/common"

export type GetDishProductsResponse = {
    result: DishProduct[]
}

type DishProduct = {
    productId: number
    nutrients: IdToQuantity
} 
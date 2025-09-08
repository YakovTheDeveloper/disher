import { PaginanationParams, SearchParams } from "@/types/api/common"
import { IdToQuantity } from "@/types/common/common"

export type GetDishProductsResponse = {
    result: DishProduct[]
}

type DishProduct = {
    productId: number
    nutrients: IdToQuantity
}

export type GetAllDishParams = PaginanationParams & { search: string }

import { IdToQuantity } from "@/types/common/common"

export type IMenu = {
    id: string,
    name: string
    description: string
    products: IProductBase[]
}

export type IProductBase = {
    name: string
    id: string
    quantity: number
}

export type IProductWithNutrients = {
    name: string
    id: string
    quantity: number
    nutrients: IdToQuantity
}
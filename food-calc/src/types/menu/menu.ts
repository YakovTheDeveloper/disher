import { IdToQuantity } from "@/types/common/common"

export type IMenu = {
    id: number,
    name: string
    description: string
    products: IProductBase[]
}

export type IProductBase = {
    name: string
    id: number
    quantity: number
}

export type IProduct = {
    id: number
    quantity: number
}

export type IProductWithNutrients = {
    name: string
    id: number
    quantity: number
    nutrients: IdToQuantity
}

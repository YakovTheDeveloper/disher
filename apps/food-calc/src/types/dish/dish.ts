import { Portion } from "@/types/common/common"

export type IDish = {
    id: number,
    name: string
    description?: string
    products: IProductBase[]
    portions: Portion[]
}

export type IProductBase = {
    name: string
    id: number
    quantity: number
}

export type IDish = {
    id: number,
    name: string
    description?: string
    products: IProductBase[]
}

export type IProductBase = {
    name: string
    id: number
    quantity: number
}
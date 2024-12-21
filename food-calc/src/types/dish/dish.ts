
export type IDish = {
    id: number,
    name: string
    description?: string
    products: IProductBase[]
}

export type IProductBase = {
    name: string
    nameRu: string
    id: number
    quantity: number
}
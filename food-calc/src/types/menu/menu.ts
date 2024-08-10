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
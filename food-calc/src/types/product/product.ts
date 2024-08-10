type Id = string

export type IProduct = {
    id: string
    name: string
    content: {
        main: {
            protein: number
            carb: number
            fat: number
        }
    }
}


export type IProducts = Record<Id, IProduct>
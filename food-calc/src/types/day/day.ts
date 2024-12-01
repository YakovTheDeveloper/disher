export type DayCategoryDish = {
    id: number,
    name: string,
    coefficient: number
    products: { id: number, quantity: number }[]
}


export type DayCategory = {
    "id": number,
    "name": string,
    position: number,
    "dishes": DayCategoryDish[]
}

import { ISODate } from "@/types/common/common"

export type DayCategoryDish = {
    id: number,
    name: string,
    quantity: number
    products: { id: number, quantity: number }[]
}


export type DayCategory = {
    "id": number,
    "name": string,
    position: number,
    "dishes": DayCategoryDish[]
}


export type Day = {
    id: number,
    categories: DayCategory[],
    date: ISODate,
    name: string

}
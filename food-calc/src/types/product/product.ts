import { Id, IdMap, IdToQuantity, Value } from "@/types/common/common"

// export type IProduct = {
//     id: string
//     name: string
//     content: {
//         main: {
//             protein: number
//             carb: number
//             fat: number
//         }
//     }
// }

export type ProductBase = {
    id: number,
    name: string,
    // nameRu: string
}

// export type ProductFull = {
//     id: number,
//     name: string,
//     nameRu: string
// }

export type IProducts = Record<Id, IProduct>

export type NutrientIdToQuantityMap = IdMap<Value>
export type ProductIdToNutrientsMap = IdMap<NutrientIdToQuantityMap>

export type RichProductData = { id: number, name: string, nutrients: IdToQuantity }

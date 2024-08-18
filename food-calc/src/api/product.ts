


import { GetProductsPayload, GetProductWithNutrientsPayload } from "@/types/api/product";
import { api, apiRoutes } from ".";



export async function fetchGetProducts(): Promise<GetProductsPayload> {
    return await api.get(apiRoutes.products.get)
}

export async function fetchGetProductWithNutrients(ids: number[]): Promise<GetProductWithNutrientsPayload> {
    return await api.get(apiRoutes.productsWithNutrients.get(ids))
}

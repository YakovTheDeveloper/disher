


import { GetProductsPayload, GetProductWithNutrientsPayload } from "@/types/api/product";
import { api, apiRoutes } from ".";
import { AxiosRequestConfig } from "axios";



export async function fetchGetProducts(): Promise<GetProductsPayload> {
    return await api.get(apiRoutes.products.get)
}

export async function fetchGetProductWithNutrients(ids: number[], config?: AxiosRequestConfig<any>): Promise<GetProductWithNutrientsPayload> {
    return await api.get(apiRoutes.productsWithNutrients.get(ids), config)
}

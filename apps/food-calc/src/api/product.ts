


import { GetProductsResponse, GetProductWithNutrientsPayload, GetRichNutrientsProductPayload, UpdatePartProductsPayload, UpdatePartProductsResponse } from "@/types/api/product";
import { api, apiRoutes } from ".";
import { AxiosRequestConfig } from "axios";



export async function fetchGetProducts(): Promise<GetProductsResponse> {
    return await api.get(apiRoutes.products.get)
}

export async function fetchUpdatePartProducts(id: number, payload: UpdatePartProductsPayload): Promise<UpdatePartProductsResponse> {
    return await api.patch(apiRoutes.products.patch(id), payload)
}

export async function fetchGetProductWithNutrients(ids: number[], config?: AxiosRequestConfig<any>): Promise<GetProductWithNutrientsPayload> {
    return await api.get(apiRoutes.productsWithNutrients.get(ids), config)
}

export async function fetchGetRichNutrientProducts(nutrientId: number, config?: AxiosRequestConfig<any>): Promise<GetRichNutrientsProductPayload> {
    return await api.get(apiRoutes.richNutrientProducts.get(nutrientId), config)
}


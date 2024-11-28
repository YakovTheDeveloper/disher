import { api, apiRoutes } from "@/api";
import { GetProductsPayload } from "@/types/api/product";

export async function fetchGetDishProducts(dishIds: string[]): Promise<GetProductsPayload> {
    return await api.get(apiRoutes.dishProducts.get(dishIds.toString()))
}
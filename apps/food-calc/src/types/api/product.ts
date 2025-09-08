import { IdToQuantity, IdToValueMap } from "@/types/common/common";
import { Product, ProductBase, ProductIdToNutrientsMap, ProductIdToPortionsMap, ProductPortion, RichProductData } from "../product/product";
import { Response } from "@/types/api/common";


export type GetProductsResponse = Response<Product[]>

export type UpdatePartProductsResponse = Response<Product>

export type GetProductWithNutrientsPayload = Response<{
    id: number,
    portions: ProductPortion[],
    nutrients: IdToQuantity
}[]>
export type GetRichNutrientsProductPayload = Response<RichProductData[]>

export type UpdatePartProductsPayload = Partial<Product>
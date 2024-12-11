import { IdToValueMap } from "@/types/common/common";
import { ProductBase, ProductIdToNutrientsMap, RichProductData } from "../product/product";
import { Response } from "@/types/api/common";


export type GetProductsPayload = Response<ProductBase[]>

export type GetProductWithNutrientsPayload = Response<ProductIdToNutrientsMap>
export type GetRichNutrientsProductPayload = Response<RichProductData[]>


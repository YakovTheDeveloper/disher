import { IdToValueMap } from "@/types/common/common";
import { ProductBase, ProductIdToNutrientsMap } from "../product/product";
import { Response } from "@/types/api/common";


export type GetProductsPayload = Response<ProductBase[]>

export type GetProductWithNutrientsPayload = Response<ProductIdToNutrientsMap>
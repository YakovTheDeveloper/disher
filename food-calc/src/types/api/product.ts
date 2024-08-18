import { IdToValueMap } from "@/types/common/common";
import { ProductBase, ProductIdToNutrientsMap } from "../product/product";


export type GetProductsPayload = ProductBase[]

export type GetProductWithNutrientsPayload = ProductIdToNutrientsMap
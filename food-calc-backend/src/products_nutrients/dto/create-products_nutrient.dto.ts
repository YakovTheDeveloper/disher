import { NutrientIdToQuantity } from "common/types";
import { IsNumberRecord } from "validators/isMappingNumberToNumber";

export class CreateProductsNutrientDto {
    @IsNumberRecord()
    nutrients: NutrientIdToQuantity
}

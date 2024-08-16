import { Type } from "class-transformer";
import { IsNotEmpty, Length, Validate, ValidateNested } from "class-validator";
import { MenuCategory, IdToQuantity } from "common/types";
import { Product } from "products/entities/product.entity";
import { User } from "users/entities/user.entity";
import { IsNumberRecord } from "validators/isMappingNumberToNumber";

export class CreateFoodCollectionDto {
    @IsNotEmpty()
    category: MenuCategory

    @IsNotEmpty()
    @Length(2, 50)
    name: string

    @Length(2, 50)
    description: string

    @IsNumberRecord()
    @ValidateNested({ each: true })
    products: IdToQuantity;
}

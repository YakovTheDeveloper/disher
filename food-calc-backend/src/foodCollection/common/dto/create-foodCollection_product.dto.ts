import { Type } from "class-transformer";
import { IsNotEmpty, Length, Validate, ValidateNested } from "class-validator";
import { MenuCategory, IdToQuantity } from "common/types";


import { Product } from "products/entities/product.entity";
import { User } from "users/entities/user.entity";
import { IsNumberRecord } from "validators/isMappingNumberToNumber";
import { FoodCollection } from "../entities/foodCollection.entity";

export class CreateFoodCollectionProductDto {
    @IsNotEmpty()
    @Type(() => Product)
    product: Product

    @IsNotEmpty()
    @Type(() => FoodCollection)
    menu: FoodCollection

    @Type(() => FoodCollection)
    dish: FoodCollection

    @IsNotEmpty()
    quantity: number
}

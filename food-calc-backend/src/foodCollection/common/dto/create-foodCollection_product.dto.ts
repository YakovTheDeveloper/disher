import { Type } from "class-transformer";
import { IsNotEmpty, Length, Validate, ValidateNested } from "class-validator";
import { MenuCategory, IdToQuantity } from "common/types";
import { IsMenuCategory } from "menus/dto/create-menu.dto";
import { Menu } from "menus/entities/menu.entity";
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

    @IsNotEmpty()
    quantity: number
}

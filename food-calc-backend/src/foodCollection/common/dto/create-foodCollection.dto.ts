import { Type } from "class-transformer";
import { IsNotEmpty, Length, Validate, ValidateNested } from "class-validator";
import { MenuCategory, IdToQuantity } from "common/types";
import { IsMenuCategory } from "menus/dto/create-menu.dto";
import { Menu } from "menus/entities/menu.entity";
import { Product } from "products/entities/product.entity";
import { User } from "users/entities/user.entity";
import { IsNumberRecord } from "validators/isMappingNumberToNumber";

export class CreateFoodCollectionDto {

    @IsNotEmpty()
    user: User

    @IsNotEmpty()
    @Validate(IsMenuCategory)
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

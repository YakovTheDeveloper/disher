import { Type } from "class-transformer";
import { IsNotEmpty } from "class-validator";
import { Menu } from "menus/entities/menu.entity";
import { Product } from "products/entities/product.entity";

export class CreateMenuProductDto {

    @IsNotEmpty()
    @Type(() => Product)
    product: Product

    @IsNotEmpty()
    @Type(() => Menu)
    menu: Menu

    @IsNotEmpty()
    quantity: number
}

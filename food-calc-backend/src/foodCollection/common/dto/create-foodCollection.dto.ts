import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString, Length, Validate, ValidateNested } from "class-validator";
import { MenuCategory, IdToQuantity } from "common/types";
import { Product } from "products/entities/product.entity";
import { PortionsDto } from "resources/common/dto/PortionsDto";
import { User } from "users/entities/user.entity";
import { IsNumberRecord } from "validators/isMappingNumberToNumber";

export class CreateDishDto {
    @IsNotEmpty()
    @Length(2, 50)
    name: string

    @Length(0, 50)
    description: string

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DishProductDto)
    products: DishProductDto[];

    portions: PortionsDto[]
}


export class DishProductDto {
    @IsNumber()
    id: number;

    @IsString()
    name: string;

    @IsNumber()
    quantity: number;
}


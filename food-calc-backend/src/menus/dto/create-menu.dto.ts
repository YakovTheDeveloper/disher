import { IsNotEmpty, Length, ValidateNested } from "class-validator";
import { TransformPlainToInstance, Type } from "class-transformer";
import { Product } from "products/entities/product.entity";
import { User } from "users/entities/user.entity";

export class CreateMenuDto {

    @IsNotEmpty()
    user: User

    @IsNotEmpty()
    @Length(2, 50)
    name: string

    @Length(2, 50)
    description: string

    // @IsNotEmpty()
    // @ValidateNested({ each: true })
    // @Type(() => Product)
    // products: Product[]

}

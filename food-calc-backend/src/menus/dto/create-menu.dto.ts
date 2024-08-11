import { IsNotEmpty, Length, ValidateNested } from "class-validator";
import { Transform, TransformPlainToInstance, Type } from "class-transformer";
import { Product } from "products/entities/product.entity";
import { User } from "users/entities/user.entity";
import { IsNumberRecord } from "validators/isMappingNumberToNumber";
import { IdToQuantity } from "common/types";

// class ProductQuantity {
//     @ValidateNested()
//     @Type(() => Product)
//     product: Product;

//     @IsNotEmpty()
//     quantity: number;
// }

export class CreateMenuDto {

    @IsNotEmpty()
    user: User

    @IsNotEmpty()
    @Length(2, 50)
    name: string

    @Length(2, 50)
    description: string

    @IsNumberRecord()
    @ValidateNested({ each: true })
    products: IdToQuantity;
}

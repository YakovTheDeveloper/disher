import { IsNotEmpty, Length, Validate, ValidateNested, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { Transform, TransformPlainToInstance, Type } from "class-transformer";
import { Product } from "products/entities/product.entity";
import { User } from "users/entities/user.entity";
import { IsNumberRecord } from "validators/isMappingNumberToNumber";
import { IdToQuantity, MenuCategory } from "common/types";

@ValidatorConstraint({ name: 'string-or-number', async: false })
export class IsMenuCategory implements ValidatorConstraintInterface {
    validate(text: string, args: ValidationArguments) {
        return text === 'menu' || text === 'dish';
    }

    defaultMessage(args: ValidationArguments) {
        return 'category is ($value), but must be "menu" or "dish"';
    }
}

export class CreateMenuDto {

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

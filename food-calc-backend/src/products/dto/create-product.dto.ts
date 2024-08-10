import { Type } from 'class-transformer';
import { isString, IsNotEmpty, Length, IsObject, ValidateNested } from 'class-validator';
import { NutrientIdToQuantity } from 'common/types';
import { IsNumberRecord } from 'validators/isMappingNumberToNumber';



export class CreateProductDto {

    @IsNotEmpty()
    @Length(2, 50)
    name: string

    @IsNotEmpty()
    @Length(10, 500)
    description: string

    @IsNumberRecord() 
    nutrients: NutrientIdToQuantity

}

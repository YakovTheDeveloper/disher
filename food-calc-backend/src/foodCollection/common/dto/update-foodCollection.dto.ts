import { PartialType } from '@nestjs/mapped-types';
import { ValidateNested } from 'class-validator';
import { IdToQuantity } from 'common/types';
import { IsNumberRecord } from 'validators/isMappingNumberToNumber';
import { CreateDishDto } from './create-foodCollection.dto';


export class UpdateFoodCollectionDto extends PartialType(CreateDishDto) {
    
}

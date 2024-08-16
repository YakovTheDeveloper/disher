import { PartialType } from '@nestjs/mapped-types';
import { ValidateNested } from 'class-validator';
import { IdToQuantity } from 'common/types';
import { IsNumberRecord } from 'validators/isMappingNumberToNumber';
import { CreateFoodCollectionDto } from './create-foodCollection.dto';


export class UpdateFoodCollectionDto extends PartialType(CreateFoodCollectionDto) {
    
}

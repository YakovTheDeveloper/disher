import { PartialType } from '@nestjs/mapped-types';
import { ValidateNested } from 'class-validator';
import { IdToQuantity } from 'common/types';
import { IsNumberRecord } from 'validators/isMappingNumberToNumber';
import { CreateFoodCollectionProductDto } from './create-foodCollection_product.dto';

export class UpdateFoodCollectionProductDto extends PartialType(CreateFoodCollectionProductDto) {

}

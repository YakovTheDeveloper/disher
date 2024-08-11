import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuProductDto } from './create-menu_product.dto';
import { ValidateNested } from 'class-validator';
import { IdToQuantity } from 'common/types';
import { IsNumberRecord } from 'validators/isMappingNumberToNumber';

export class UpdateMenuProductDto extends PartialType(CreateMenuProductDto) {
    
}

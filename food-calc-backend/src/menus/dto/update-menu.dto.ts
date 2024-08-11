import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuDto } from './create-menu.dto';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { IdToQuantity } from 'common/types';
import { IsNumberRecord } from 'validators/isMappingNumberToNumber';

export class UpdateMenuDto extends PartialType(CreateMenuDto) {
}

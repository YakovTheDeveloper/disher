import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuProductDto } from './create-menu_product.dto';

export class UpdateMenuProductDto extends PartialType(CreateMenuProductDto) {}

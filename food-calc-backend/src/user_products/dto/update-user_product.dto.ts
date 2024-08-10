import { PartialType } from '@nestjs/mapped-types';
import { CreateUserProductDto } from './create-user_product.dto';

export class UpdateUserProductDto extends PartialType(CreateUserProductDto) {}

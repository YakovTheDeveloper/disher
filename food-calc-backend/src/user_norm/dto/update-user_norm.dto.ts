import { PartialType } from '@nestjs/mapped-types';
import { CreateUserNormDto } from './create-user_norm.dto';

export class UpdateUserNormDto extends PartialType(CreateUserNormDto) {}

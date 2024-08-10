import { PartialType } from '@nestjs/mapped-types';
import { CreateNutrientDto } from './create-nutrient.dto';

export class UpdateNutrientDto extends PartialType(CreateNutrientDto) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateProductsNutrientDto } from './create-products_nutrient.dto';

export class UpdateProductsNutrientDto extends PartialType(CreateProductsNutrientDto) {}

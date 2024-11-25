import { Type } from 'class-transformer';
import { IsString, IsArray, ArrayNotEmpty, IsNumber, ValidateNested, IsOptional } from 'class-validator';

class DayCategoryDishDto {
  @IsNumber()
  id: string;
  
  @IsOptional()
  @IsNumber()
  position?: number;
}


export class DayCategoryDto {
  @IsString()
  name: string;

  @IsNumber()
  position: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayCategoryDishDto)
  dishes: DayCategoryDishDto[];
}

export class CreateDayDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayCategoryDto)
  categories: DayCategoryDto[];
}
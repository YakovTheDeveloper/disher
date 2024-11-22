import { Type } from 'class-transformer';
import { IsString, IsArray, ArrayNotEmpty, IsNumber, ValidateNested } from 'class-validator';

class DayCategoryDishDto {
  @IsNumber()
  id: string;

  @IsNumber()
  position: number;
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
  dayName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayCategoryDto)
  dayContent: DayCategoryDto[];
}
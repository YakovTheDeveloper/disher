import { Type } from 'class-transformer';
import { IsString, IsArray, ArrayNotEmpty, IsNumber, ValidateNested } from 'class-validator';


class DayCategoryDto {
  @IsString()
  name: string;

  @IsArray()
  @IsNumber({}, { each: true })
  dishIds: number[];
}

export class CreateDayDto {
  @IsString()
  dayName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayCategoryDto)
  dayContent: DayCategoryDto[];
}
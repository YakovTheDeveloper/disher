import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateDayCategoryDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  menuIds: number[];
}
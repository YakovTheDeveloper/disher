import { IsArray, IsInt, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class UpdateDishDto {
    @IsInt()
    @IsNotEmpty()
    menuId: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    dishIds: number[];
}

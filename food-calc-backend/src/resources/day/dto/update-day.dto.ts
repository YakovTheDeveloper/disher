import { PartialType } from '@nestjs/mapped-types';
import { CreateDayDto } from './create-day.dto';
import { IsString } from 'class-validator';

export class UpdateDayDto extends PartialType(CreateDayDto) { }

export class PartUpdateDayDto {
    @IsString()
    date: string
}
import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { PrimaryGeneratedColumn } from "typeorm";

export class CreateUserDto {

    @PrimaryGeneratedColumn()
    id: number

    @IsNotEmpty()
    @MinLength(1, { message: 'Password must be at least 1 characters long' })
    login: string;

    @IsString()
    @MinLength(4, { message: 'Password must be at least 4 characters long' })
    password: string;

    @IsString()
    @MinLength(4)
    confirmPassword: string;
}

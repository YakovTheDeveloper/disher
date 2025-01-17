import { IsNotEmpty, Length, IsNumber } from "class-validator"

export class PortionsDto {
    @IsNotEmpty()
    @Length(2, 20)
    name: string

    @IsNotEmpty()
    @IsNumber()
    quantity: number
}

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './auth.dto';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signIn')
    login(@Body() dto: LoginUserDto) {
        return this.authService.login(dto)
    }

    @Post('signUp')
    signUp(@Body() dto: CreateUserDto) {
        return this.authService.signUp(dto)
    }


}

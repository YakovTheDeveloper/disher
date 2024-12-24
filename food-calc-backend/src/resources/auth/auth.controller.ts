import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './auth.dto';
import { LocalAuthGuard } from 'resources/auth/auth.guard';


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

    @UseGuards(LocalAuthGuard)
    @Get('me')
    getUser(@Req() request: Request) {
        const userId = request.user?.id
        if (userId == null) {
            throw new BadRequestException('No such user id');
        }
        return this.authService.getMe(userId)
    }
}

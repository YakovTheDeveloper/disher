import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'users/users.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, LoginUserDto } from './auth.dto';
import { instanceToPlain } from 'class-transformer'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(token: string): Promise<any> {
        return await this.validateJwtToken(token)
    }

    async signUp(user: CreateUserDto) {
        const { login, password, confirmPassword } = user
        if (password !== confirmPassword) {
            throw new BadRequestException('Password must be same');
        }

        const existedUser = await this.usersService.findByLogin(user.login)
        if (existedUser) {
            throw new BadRequestException('User with this login already exist');
        }

        const hashedPassword = await this.hashPassword(password)
        const createdUser = await this.usersService.create({
            login,
            password: hashedPassword
        })

        {
            const { password, ...jwtPayload } = createdUser

            return {
                access_token: this.jwtService.sign({
                    ...jwtPayload
                }),
            };
        }
    }

    async login(user: LoginUserDto) {
        const existedUser = await this.usersService.findByLogin(user.login)
        if (!existedUser) {
            throw new BadRequestException("User with such login doesn't exist");
        }

        const validated = await this.validatePassword(user.password, existedUser.password)
        if (!validated) {
            throw new BadRequestException("Wrong password");
        }

        const { password, ...jwtPayload } = existedUser

        return {
            access_token: this.jwtService.sign(jwtPayload),
        };
    }

    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    async createJwtToken(userId: string, email: string): Promise<string> {
        const payload = { sub: userId, email };
        return this.jwtService.sign(payload);
    }

    async validateJwtToken(token: string): Promise<any> {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new BadRequestException('Invalid token');
        }
    }
}
import { Module } from '@nestjs/common';


import { JwtStrategy } from './jwt.strategy';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'users/users.module';
import { AuthService } from './auth.service';
import { usersProviders } from 'users/users.providers';
import { UsersService } from 'users/users.service';
import { DatabaseModule } from 'database/database.module';
import { AuthController } from './auth.controller';
import { LocalAuthGuard } from './auth.guard';

export const jwtConstants = {
    secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};

@Module({
    imports: [
        DatabaseModule,
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '365 days' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, ...usersProviders, UsersService],
    exports: [AuthService],
})
export class AuthModule { }
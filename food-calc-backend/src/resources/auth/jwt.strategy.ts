// src/auth/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'yourSecretKey',
        });
    }

    async validate(payload: any) {

        

        // Here you can add logic to validate the user based on the payload
        // For example, fetch the user from the database using the payload.sub (userId)
        return { userId: payload.sub, email: payload.email };
    }
}

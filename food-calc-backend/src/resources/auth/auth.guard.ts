import { Injectable, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    constructor(@Inject(AuthService) private authService: AuthService) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        const token = authHeader?.split(' ')?.[1];
        if (!token) {
            throw new UnauthorizedException('Token not provided');
        }
        console.log(token)
        const user = await this.authService.validateUser(token);
        console.log('@@@@@@@@@@@@@@', user)
        if (!user) {
            throw new UnauthorizedException();
        }

        request.user = user;
        return true;
    }
}
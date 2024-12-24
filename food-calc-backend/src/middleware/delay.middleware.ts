import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DelayMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: NextFunction) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        next();
    }
}

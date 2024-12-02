import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DelayMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: NextFunction) {
        // Simulate a delay of 2000ms (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Continue to the next middleware or route handler
        next();
    }
}

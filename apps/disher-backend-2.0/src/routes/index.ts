import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../client';
import { scheduleRoutes } from './schedule.route';
import { t } from '../trpc';
import { userRoutes } from './user.route';
import { dihesRoutes } from './dish.route/dish.route';
import { foodRoutes } from './food.route/food.route';
type User = {
    id: string;
    name: string;
    bio?: string;
};
export const appRouter = t.router({
    ...scheduleRoutes,
    ...userRoutes,
    ...dihesRoutes,
    ...foodRoutes
});
// export type definition of API
export type AppRouter = typeof appRouter;
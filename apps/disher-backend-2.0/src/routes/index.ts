import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../client';
import { scheduleRoutes } from './schedule.route';
import { t } from '../trpc';
import { userRoutes } from './user.route';
type User = {
    id: string;
    name: string;
    bio?: string;
};
export const appRouter = t.router({
    ...scheduleRoutes,
    ...userRoutes
});
// export type definition of API
export type AppRouter = typeof appRouter;
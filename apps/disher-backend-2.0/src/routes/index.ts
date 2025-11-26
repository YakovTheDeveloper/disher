import { initTRPC } from '@trpc/server';
import superjson from 'superjson'
import { z } from 'zod';
import { prisma } from '../client';
import { scheduleRoutes } from './schedule.route';
import { t } from '../trpc';
import { userRoutes } from './user.route';
import { dihesRoutes } from './dish.route/dish.route';
import { foodRoutes } from './food.route/food.route';
import { questionnaireRoute } from './questionnaire.route/questionnaire.route';
import { dailyNormRoute } from './norm.route/norm.route';

export const appRouter = t.router({
    ...scheduleRoutes,
    ...userRoutes,
    ...dihesRoutes,
    ...foodRoutes,
    ...questionnaireRoute,
    ...dailyNormRoute,
})


// export type definition of API
export type AppRouter = typeof appRouter;
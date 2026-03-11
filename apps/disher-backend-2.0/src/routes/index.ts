import { initTRPC } from '@trpc/server';
import superjson from 'superjson'
import { z } from 'zod';
import { prisma } from '../client.js';
import { scheduleRoutes } from './schedule.route/schedule.route.js';
import { t } from '../trpc.js';
import { userRoutes } from './user.route.js';
import { dihesRoutes } from './dish.route/dish.route.js';
import { foodRoutes } from './food.route/food.route.js';
import { questionnaireRoute } from './questionnaire.route/questionnaire.route.js';
import { dailyNormRoute } from './norm.route/norm.route.js';
import { analyticsRoutes } from './analytics/analytics.route.js';

export const appRouter = t.router({
    ...scheduleRoutes,
    ...userRoutes,
    ...dihesRoutes,
    ...foodRoutes,
    ...questionnaireRoute,
    ...dailyNormRoute,
    ...analyticsRoutes,
})


// export type definition of API
export type AppRouter = typeof appRouter;
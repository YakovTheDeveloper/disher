import { initTRPC } from '@trpc/server';
import { transformIds } from './plugins/transformIds.js';

export const t = initTRPC.create();

export const idStringifier = t.middleware(async ({ next }) => {
    const result = await next();

    return transformIds(result);
});

export const router = t.router;
export const publicProcedure = t.procedure.use(idStringifier);
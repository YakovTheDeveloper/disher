import {
    fastifyTRPCPlugin,
    FastifyTRPCPluginOptions,
} from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import { AppRouter, appRouter } from './routes';
import { createContext } from './context'
import cors from '@fastify/cors';



const server = fastify();

server.register(cors, {
    origin: true, // allow all origins or use specific: ['http://localhost:3000']
    credentials: true, // if you need cookies
});

server.addHook('preHandler', async (request, reply) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
});

server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
        router: appRouter,
        createContext,
        experimental: {
            responseStreaming: false,
        },
        batching: {
            enabled: true, // optional
        },
    },
});

(async () => {
    try {
        await server.listen({ port: 3000 });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
})();
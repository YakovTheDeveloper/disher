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
    origin: [
        'http://localhost:5173',
        'http://192.168.88.235:5173',
    ],
    credentials: true,
});
server.addHook('preHandler', async (request, reply) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
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

const host = process.env.HOST || 'localhost';
const port = Number(process.env.PORT) || 3000;

(async () => {
    try {
        await server.listen({ port, host });
        console.log(`🚀 Server running at http://${host}:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
})();
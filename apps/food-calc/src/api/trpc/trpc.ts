import { createTRPCProxyClient, httpBatchLink, httpLink, httpBatchStreamLink } from '@trpc/client';
import type { AppRouter } from '@api';
// import type { AppRouter } from '../../../../../packages/api/src/index'

const host = import.meta.env.VITE_HOST || 'localhost';
const port = Number(import.meta.env.VITE_PORT) || 3000;

// 192.168.88.235:3000

export const trpc = createTRPCProxyClient<AppRouter>({
    links: [
        httpBatchLink({
            url: `http://${host}:${port}/trpc`,
            // Don't set method: 'GET'
            headers() {
                return {
                    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                };
            },
        }),
    ],
});
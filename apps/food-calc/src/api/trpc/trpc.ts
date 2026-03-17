import { createTRPCProxyClient, httpBatchLink, httpLink, httpBatchStreamLink } from '@trpc/client';
import type { AppRouter } from '@api';
// import type { AppRouter } from '../../../../../packages/api/src/index'

const port = Number(import.meta.env.VITE_PORT) || 3000;
const host = window.location.hostname;

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
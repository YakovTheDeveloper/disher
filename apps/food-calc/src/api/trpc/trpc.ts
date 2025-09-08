import { createTRPCProxyClient, httpBatchLink, httpLink, httpBatchStreamLink } from '@trpc/client';
import type { AppRouter } from '@api';
// import type { AppRouter } from '../../../../../packages/api/src/index'

export const trpc = createTRPCProxyClient<AppRouter>({
    links: [
        httpBatchLink({
            url: 'http://localhost:3000/trpc',
            // Don't set method: 'GET'
            headers() {
                return {
                    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                };
            },
        }),
    ],
});
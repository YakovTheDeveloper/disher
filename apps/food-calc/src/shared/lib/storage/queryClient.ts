import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 7 * 24 * 60 * 60_000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      networkMode: 'always',
      retry: (failureCount) => navigator.onLine && failureCount < 3,
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

import { QueryClient } from '@tanstack/react-query';
import { ApiRequestError } from './http';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 20,
      retry: (failureCount, error) =>
        error instanceof ApiRequestError &&
        typeof error.status === 'number' &&
        error.status >= 500 &&
        failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});

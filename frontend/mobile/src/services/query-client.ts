import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { MobileApiError } from '@/api/client';

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= 2) {
    return false;
  }

  if (error instanceof MobileApiError) {
    if (!error.statusCode) {
      return true;
    }

    if ([401, 403, 404, 409, 422].includes(error.statusCode)) {
      return false;
    }

    return error.statusCode >= 500 || error.statusCode === 429;
  }

  return true;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache(),
  mutationCache: new MutationCache(),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 20,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: shouldRetry,
    },
  },
});

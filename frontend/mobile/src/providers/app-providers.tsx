import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionBootstrap } from '@/providers/session-bootstrap';
import { queryClient } from '@/services/query-client';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap />
        {children}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

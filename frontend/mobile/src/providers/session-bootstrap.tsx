import { useEffect, useRef } from 'react';

import { mobileApi } from '@/api/client';
import { queryClient } from '@/services/query-client';
import { disconnectLiveRoomSocket } from '@/services/realtime/live-room-socket';
import { useSessionStore } from '@/store/session-store';

export function SessionBootstrap() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const signOut = useSessionStore((state) => state.signOut);
  const setAuthBootstrapState = useSessionStore((state) => state.setAuthBootstrapState);
  const lastTokenRef = useRef<string | null>(null);
  const lastBootstrapKeyRef = useRef<string | null>(null);
  const bootstrapKey =
    session?.tokens.refreshToken ?? session?.tokens.accessToken ?? null;

  useEffect(() => {
    const currentToken = session?.tokens.accessToken ?? null;
    const hadToken = lastTokenRef.current;

    if (hadToken && !currentToken) {
      disconnectLiveRoomSocket();
      queryClient.clear();
    }

    lastTokenRef.current = currentToken;
  }, [session?.tokens.accessToken]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let active = true;

    const bootstrap = async () => {
      if (!bootstrapKey) {
        lastBootstrapKeyRef.current = null;
        setAuthBootstrapState('ready');
        return;
      }

      if (lastBootstrapKeyRef.current === bootstrapKey) {
        setAuthBootstrapState('ready');
        return;
      }

      lastBootstrapKeyRef.current = bootstrapKey;
      setAuthBootstrapState('restoring');

      try {
        const restoredSession = await mobileApi.getCurrentSession();

        if (!active || !restoredSession) {
          return;
        }

        setSession(restoredSession);
        setAuthBootstrapState('ready');
      } catch (error) {
        if (!active) {
          return;
        }

        signOut();
        setAuthBootstrapState(
          'ready',
          error instanceof Error ? error.message : 'Unable to restore the current session.',
        );
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [
    bootstrapKey,
    hydrated,
    setAuthBootstrapState,
    setSession,
    signOut,
  ]);

  return null;
}

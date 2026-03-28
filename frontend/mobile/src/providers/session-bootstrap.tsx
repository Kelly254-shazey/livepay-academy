import { useEffect, useRef } from 'react';

import { mobileApi } from '@/api/client';
import { queryClient } from '@/services/query-client';
import { disconnectLiveRoomSocket } from '@/services/realtime/live-room-socket';
import { normalizeAuthSession } from '@/shared';
import { useSessionStore } from '@/store/session-store';

export function SessionBootstrap() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const session = useSessionStore((state) => state.session);
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const signOut = useSessionStore((state) => state.signOut);
  const setAuthBootstrapState = useSessionStore((state) => state.setAuthBootstrapState);
  const lastTokenRef = useRef<string | null>(null);

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
      if (!session?.tokens.accessToken && !session?.tokens.refreshToken) {
        setAuthBootstrapState('ready');
        return;
      }

      setAuthBootstrapState('restoring');

      try {
        const restoredSession = await mobileApi.getCurrentSession();

        if (!active || !restoredSession) {
          return;
        }

        const normalizedSession = normalizeAuthSession(
          restoredSession,
          preferredRoles,
          preferredRole,
        );

        setSession(normalizedSession);
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
    hydrated,
    preferredRole,
    preferredRoles,
    session?.tokens.accessToken,
    session?.tokens.refreshToken,
    setAuthBootstrapState,
    setSession,
    signOut,
  ]);

  return null;
}

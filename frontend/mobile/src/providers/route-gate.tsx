import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { getRequiredAuthStep } from '@/shared';
import { useSessionStore } from '@/store/session-store';

export function RouteGate() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useSessionStore((state) => state.hydrated);
  const authBootstrapStatus = useSessionStore((state) => state.authBootstrapStatus);
  const hasSeenOnboarding = useSessionStore((state) => state.hasSeenOnboarding);
  const session = useSessionStore((state) => state.session);
  const lastRouteRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || authBootstrapStatus !== 'ready') {
      return;
    }

    const root = segments[0];
    const child = segments[1];
    let nextRoute: string | null = null;

    if (!hasSeenOnboarding && (root !== '(public)' || child !== 'onboarding')) {
      nextRoute = '/(public)/onboarding';
    } else if (!session) {
      if (root !== '(public)') {
        nextRoute = '/(public)/role-selection';
      }
    } else if (getRequiredAuthStep(session) === 'verify-email') {
      if (segments[1] !== 'email-verification') {
        nextRoute = '/(public)/email-verification';
      }
    } else if (getRequiredAuthStep(session) === 'complete-profile') {
      if (segments[1] !== 'profile-completion') {
        nextRoute = '/(public)/profile-completion';
      }
    } else if (session.user.role === 'creator') {
      if (root !== '(creator)') {
        nextRoute = '/(creator)/(tabs)/dashboard';
      }
    } else if (session.user.role === 'admin' || session.user.role === 'moderator') {
      if (root !== '(staff)') {
        nextRoute = '/(staff)/dashboard';
      }
    } else {
      if (root !== '(viewer)') {
        nextRoute = '/(viewer)/(tabs)/home';
      }
    }

    if (nextRoute && lastRouteRef.current !== nextRoute) {
      lastRouteRef.current = nextRoute;
      router.replace(nextRoute as never);
      return;
    }

    if (!nextRoute) {
      lastRouteRef.current = null;
    }
  }, [authBootstrapStatus, hasSeenOnboarding, hydrated, router, segments, session]);

  return null;
}

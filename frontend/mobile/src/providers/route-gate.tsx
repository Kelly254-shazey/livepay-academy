import { useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/session-store';

export function RouteGate() {
  const router = useRouter();
  const segments = useSegments();
  const [bootReady, setBootReady] = useState(false);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hasSeenOnboarding = useSessionStore((state) => state.hasSeenOnboarding);
  const session = useSessionStore((state) => state.session);

  useEffect(() => {
    const timer = setTimeout(() => setBootReady(true), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || !bootReady) return;

    const root = segments[0];

    if (!hasSeenOnboarding && root !== '(public)') {
      router.replace('/(public)/onboarding');
      return;
    }

    if (!session) {
      if (root !== '(public)') {
        router.replace('/(public)/sign-in');
      }
      return;
    }

    if (session.user.role === 'creator') {
      if (root !== '(creator)') {
        router.replace('/(creator)/(tabs)/dashboard');
      }
      return;
    }

    if (root !== '(viewer)') {
      router.replace('/(viewer)/(tabs)/home');
    }
  }, [bootReady, hasSeenOnboarding, hydrated, router, segments, session]);

  return null;
}

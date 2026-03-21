import { Redirect } from 'expo-router';
import { SplashScreenView } from '@/screens/public';
import { useSessionStore } from '@/store/session-store';

function nextPathForRole(role: 'viewer' | 'creator' | 'moderator' | 'admin') {
  if (role === 'creator') return '/(creator)/(tabs)/dashboard';
  if (role === 'admin' || role === 'moderator') return '/(staff)/dashboard';
  return '/(viewer)/(tabs)/home';
}

export default function IndexPage() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const hasSeenOnboarding = useSessionStore((state) => state.hasSeenOnboarding);
  const session = useSessionStore((state) => state.session);

  if (!hydrated) {
    return <SplashScreenView />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(public)/onboarding" />;
  }

  if (!session) {
    return <Redirect href="/(public)/sign-in" />;
  }

  return <Redirect href={nextPathForRole(session.user.role)} />;
}

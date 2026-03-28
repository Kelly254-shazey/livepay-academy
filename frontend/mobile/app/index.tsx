import { Redirect } from 'expo-router';
import { SplashScreenView } from '@/screens/public';
import { getRequiredAuthStep } from '@/shared';
import { useSessionStore } from '@/store/session-store';

function nextPathForRole(role: 'viewer' | 'creator' | 'moderator' | 'admin', roles?: string[]) {
  if (role === 'creator') return '/(creator)/(tabs)/dashboard';
  if (role === 'admin' || role === 'moderator') return '/(staff)/dashboard';
  return '/(viewer)/(tabs)/home';
}

export default function IndexPage() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const authBootstrapStatus = useSessionStore((state) => state.authBootstrapStatus);
  const hasSeenOnboarding = useSessionStore((state) => state.hasSeenOnboarding);
  const session = useSessionStore((state) => state.session);

  if (!hydrated || authBootstrapStatus !== 'ready') {
    return <SplashScreenView />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(public)/onboarding" />;
  }

  if (!session) {
    return <Redirect href="/(public)/role-selection" />;
  }

  const requiredAuthStep = getRequiredAuthStep(session);
  if (requiredAuthStep === 'verify-email') {
    return <Redirect href="/(public)/email-verification" />;
  }

  if (requiredAuthStep === 'complete-profile') {
    return <Redirect href="/(public)/profile-completion" />;
  }

  return <Redirect href={nextPathForRole(session.user.role, session.user.roles)} />;
}

import { Redirect, Stack } from 'expo-router';
import { getRequiredAuthStep } from '@/shared';
import { useSessionStore } from '@/store/session-store';

function nextPathForRole(role: 'viewer' | 'creator' | 'moderator' | 'admin', roles?: string[]) {
  if (role === 'creator') return '/(creator)/(tabs)/dashboard';
  if (role === 'admin' || role === 'moderator') return '/(staff)/dashboard';
  return '/(viewer)/(tabs)/home';
}

export default function PublicLayout() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const authBootstrapStatus = useSessionStore((state) => state.authBootstrapStatus);
  const session = useSessionStore((state) => state.session);

  if (!hydrated || authBootstrapStatus !== 'ready') {
    return null;
  }

  if (session) {
    const requiredAuthStep = getRequiredAuthStep(session);

    if (requiredAuthStep === 'verify-email') {
      return <Redirect href="/(public)/email-verification" />;
    }

    if (requiredAuthStep === 'complete-profile') {
      return <Redirect href="/(public)/profile-completion" />;
    }

    return <Redirect href={nextPathForRole(session.user.role, session.user.roles)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

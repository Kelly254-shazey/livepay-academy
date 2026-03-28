import { Redirect, Stack } from 'expo-router';
import { getRequiredAuthStep } from '@/shared';
import { useSessionStore } from '@/store/session-store';

export default function CreatorLayout() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const authBootstrapStatus = useSessionStore((state) => state.authBootstrapStatus);
  const session = useSessionStore((state) => state.session);

  if (!hydrated || authBootstrapStatus !== 'ready') {
    return null;
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

  if (session.user.role === 'viewer') {
    return <Redirect href="/(viewer)/(tabs)/home" />;
  }

  if (session.user.role === 'admin' || session.user.role === 'moderator') {
    return <Redirect href="/(staff)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

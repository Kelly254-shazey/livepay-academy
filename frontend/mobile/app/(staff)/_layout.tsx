import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '@/store/session-store';

export default function StaffLayout() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const authBootstrapStatus = useSessionStore((state) => state.authBootstrapStatus);
  const session = useSessionStore((state) => state.session);

  if (!hydrated || authBootstrapStatus !== 'ready') {
    return null;
  }

  if (!session) {
    return <Redirect href="/(public)/staff-access" />;
  }

  if (session.user.role === 'creator') {
    return <Redirect href="/(creator)/(tabs)/dashboard" />;
  }

  if (session.user.role === 'viewer') {
    return <Redirect href="/(viewer)/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

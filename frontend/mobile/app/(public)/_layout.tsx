import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '@/store/session-store';

function nextPathForRole(role: 'viewer' | 'creator' | 'moderator' | 'admin') {
  if (role === 'creator') return '/(creator)/(tabs)/dashboard';
  if (role === 'admin' || role === 'moderator') return '/(staff)/dashboard';
  return '/(viewer)/(tabs)/home';
}

export default function PublicLayout() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const session = useSessionStore((state) => state.session);

  if (!hydrated) {
    return null;
  }

  if (session) {
    return <Redirect href={nextPathForRole(session.user.role)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

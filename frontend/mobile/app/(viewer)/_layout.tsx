import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '@/store/session-store';

export default function ViewerLayout() {
  const hydrated = useSessionStore((state) => state.hydrated);
  const session = useSessionStore((state) => state.session);

  if (!hydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(public)/sign-in" />;
  }

  if (session.user.role === 'creator') {
    return <Redirect href="/(creator)/(tabs)/dashboard" />;
  }

  if (session.user.role === 'admin' || session.user.role === 'moderator') {
    return <Redirect href="/(staff)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

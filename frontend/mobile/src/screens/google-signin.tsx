import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileApi } from '@/api/client';
import { Badge, Button, Heading, Screen, Surface } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';
import { theme } from '@/theme';
import {
  getGoogleSignInHelpText,
  initializeGoogleSignIn,
  isGoogleSignInConfigured,
  signInWithGoogle,
} from '@/utils/google-signin';

export function GoogleSignInScreen() {
  const setSession = useSessionStore((state) => state.setSession);
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const googleConfigured = isGoogleSignInConfigured();
  const googleHelpText = getGoogleSignInHelpText();

  React.useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await signInWithGoogle();
      return mobileApi.signInWithGoogle({
        idToken: result.idToken,
        role: preferredRole,
        roles: preferredRoles,
      });
    },
    onSuccess: (session) => {
      setSession(session);
      if (session.nextStep === 'verify-email') {
        router.replace('/(public)/email-verification');
        return;
      }

      if (session.nextStep === 'complete-profile') {
        router.replace('/(public)/profile-completion');
        return;
      }

      if (session.user.role === 'creator') {
        router.replace('/(creator)/(tabs)/dashboard');
        return;
      }

      router.replace('/(viewer)/(tabs)/home');
    },
  });

  return (
    <Screen>
      <Heading title="Sign in with Google" />
      <Surface>
        <Text style={styles.infoText}>
          {googleHelpText}
        </Text>
        {mutation.isError ? (
          <Text style={styles.errorText}>{(mutation.error as Error).message}</Text>
        ) : null}
        <Button
          disabled={!googleConfigured || mutation.isPending}
          onPress={() => mutation.mutate()}
          title={mutation.isPending ? 'Signing in...' : 'Continue with Google'}
        />
        <Button
          onPress={() => router.back()}
          title="Back"
          variant="ghost"
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.danger,
    fontWeight: theme.typography.weights.medium,
  },
});

export default GoogleSignInScreen;

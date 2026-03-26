import { brand } from '../shared';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { mobileApi } from '@/api/client';
import { Badge, Button, Heading, Screen, Surface } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';
import { theme } from '@/theme';

// This is a placeholder for Google sign-in integration
// In production, use @react-native-google-signin/google-signin or expo-auth-session
export function GoogleSignInScreen() {
  const setSession = useSessionStore((state) => state.setSession);
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const [loading, setLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // TODO: Integrate with actual Google Sign-In provider
      // const idToken = await getGoogleIdToken();
      // const session = await mobileApi.signInWithGoogle({ idToken, role: preferredRole });
      // setSession(session);
      alert('Google sign-in integration needed - install @react-native-google-signin/google-signin');
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Heading title="Sign in with Google" />
      <Surface>
        <Text style={styles.infoText}>
          To enable Google Sign-In, install the Google Sign-In library and configure your credentials.
        </Text>
        <Button 
          disabled={loading}
          onPress={handleGoogleSignIn} 
          title={loading ? 'Signing in...' : 'Continue with Google'}
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
});

export default GoogleSignInScreen;

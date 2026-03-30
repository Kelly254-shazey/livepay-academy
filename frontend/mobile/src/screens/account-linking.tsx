import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { mobileApi } from '@/api/client';
import { Badge, Button, Heading, Screen, Surface, TextField } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';
import { theme } from '@/theme';
import {
  getGoogleSignInHelpText,
  initializeGoogleSignIn,
  isGoogleSignInConfigured,
  signInWithGoogle,
} from '@/utils/google-signin';

const linkPasswordSchema = z.object({
  password: z.string().min(8),
});

const linkGoogleSchema = z.object({
  idToken: z.string().min(20),
});

export function AccountLinkingScreen() {
  const session = useSessionStore((state) => state.session);
  const [linkType, setLinkType] = React.useState<'password' | 'google' | null>(null);

  if (!session) {
    return (
      <Screen>
        <Heading title="Not authenticated" />
        <Surface>
          <Text style={styles.errorText}>Please sign in first to link accounts.</Text>
          <Button onPress={() => router.replace('/(public)/sign-in')} title="Go to sign in" />
        </Surface>
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading title="Link account" />
      <Surface>
        <Text style={styles.infoText}>
          Link additional authentication methods to your {session.user.fullName} account.
        </Text>

        {!linkType ? (
          <View style={{ gap: theme.spacing.md }}>
            <Button 
              onPress={() => setLinkType('password')}
              title="Link password"
              variant="secondary"
            />
            <Button 
              onPress={() => setLinkType('google')}
              title="Link Google account"
              variant="secondary"
            />
            <Button 
              onPress={() => router.back()}
              title="Back"
              variant="ghost"
            />
          </View>
        ) : linkType === 'password' ? (
          <LinkPasswordForm onCancel={() => setLinkType(null)} />
        ) : (
          <LinkGoogleForm onCancel={() => setLinkType(null)} />
        )}
      </Surface>
    </Screen>
  );
}

function LinkPasswordForm({ onCancel }: { onCancel: () => void }) {
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof linkPasswordSchema>>({
    resolver: zodResolver(linkPasswordSchema),
    defaultValues: { password: '' },
  });

  const mutation = useMutation({
    mutationFn: mobileApi.linkPassword,
    onSuccess: (result) => {
      if (session) {
        setSession({
          ...session,
          user: {
            ...session.user,
            ...result.user,
          },
        });
      }
      alert('Password linked successfully');
      onCancel();
    },
  });

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Controller
        control={form.control}
        name="password"
        render={({ field }) => (
          <TextField 
            label="Create password" 
            onChangeText={field.onChange} 
            placeholder="Secure password" 
            secureTextEntry 
            value={field.value} 
          />
        )}
      />
      {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
      <Button 
        onPress={form.handleSubmit((values) => mutation.mutate(values))}
        title={mutation.isPending ? 'Linking...' : 'Link password'}
      />
      <Button onPress={onCancel} title="Back" variant="ghost" />
    </View>
  );
}

function LinkGoogleForm({ onCancel }: { onCancel: () => void }) {
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const googleConfigured = isGoogleSignInConfigured();
  const googleHelpText = getGoogleSignInHelpText();

  React.useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  const mutation = useMutation({
    mutationFn: mobileApi.linkGoogleAccount,
    onSuccess: (result) => {
      if (session) {
        setSession({
          ...session,
          user: {
            ...session.user,
            ...result.user,
          },
        });
      }
      alert('Google account linked successfully');
      onCancel();
    },
  });

  const handleGoogleLink = async () => {
    try {
      const result = await signInWithGoogle();
      mutation.mutate({ idToken: result.idToken });
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text style={styles.infoText}>
        {googleConfigured
          ? 'Tap below to link your Google account to this profile.'
          : googleHelpText}
      </Text>
      {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
      <Button
        onPress={handleGoogleLink}
        title={mutation.isPending ? 'Linking...' : 'Link Google'}
        disabled={!googleConfigured || mutation.isPending}
      />
      <Button onPress={onCancel} title="Back" variant="ghost" />
    </View>
  );
}

const styles = StyleSheet.create({
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.danger,
    fontWeight: theme.typography.weights.medium,
  },
});

export default AccountLinkingScreen;

import type { UserRole } from '@livegate/shared';
import { brand, productRules } from '@livegate/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';
import { mobileApi } from '@/api/client';
import { Button, Heading, Screen, Surface, TextField } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';

function nextPathForRole(role: UserRole) {
  return role === 'creator' ? '/(creator)/(tabs)/dashboard' : '/(viewer)/(tabs)/home';
}

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(4),
  password: z.string().min(8),
});

export function SplashScreenView() {
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 44, fontWeight: '700', color: '#171512' }}>{brand.name}</Text>
        <Text style={{ fontSize: 16, lineHeight: 24, color: '#6E675C' }}>{brand.tagline}</Text>
      </View>
    </Screen>
  );
}

export function OnboardingScreen() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);

  return (
    <Screen>
      <Heading
        body="Discover creators, pay for premium access, attend paid live sessions, and build a serious creator business from the same product surface."
        eyebrow="Onboarding"
        title="LiveGate keeps the experience calm while the rules stay strict."
      />
      {productRules.slice(0, 4).map((rule) => (
        <Surface key={rule}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#171512' }}>{rule}</Text>
        </Surface>
      ))}
      <Button
        onPress={() => {
          completeOnboarding();
          router.replace('/(public)/role-selection');
        }}
        title="Continue"
      />
    </Screen>
  );
}

export function RoleSelectionScreen() {
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const setPreferredRole = useSessionStore((state) => state.setPreferredRole);

  const roles: Array<{ role: UserRole; title: string; body: string }> = [
    { role: 'viewer', title: 'Viewer', body: 'Pay for lives, unlock premium content, and enroll in classes.' },
    { role: 'creator', title: 'Creator', body: 'Create paid live sessions, premium content, classes, and payouts.' },
  ];

  return (
    <Screen>
      <Heading
        body="Choose the role context that should shape your initial mobile experience."
        eyebrow="Role"
        title="Who are you using LiveGate as?"
      />
      {roles.map((item) => (
        <Surface key={item.role}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#171512' }}>{item.title}</Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: '#6E675C' }}>{item.body}</Text>
          <Button
            onPress={() => setPreferredRole(item.role)}
            title={preferredRole === item.role ? 'Selected' : `Use ${item.title}`}
            variant={preferredRole === item.role ? 'primary' : 'secondary'}
          />
        </Surface>
      ))}
      <Button onPress={() => router.push('/(public)/sign-up')} title="Continue to sign up" />
      <Button onPress={() => router.push('/(public)/sign-in')} title="I already have an account" variant="ghost" />
    </Screen>
  );
}

export function SignInScreen() {
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      mobileApi.signIn({ ...values, role: preferredRole }),
    onSuccess: (session) => {
      setSession(session);
      router.replace(nextPathForRole(session.user.role));
    },
  });

  return (
    <Screen>
      <Heading
        body="Sign in to continue into your role-aware mobile dashboard."
        eyebrow="Auth"
        title="Sign in"
      />
      <Surface>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField label="Email" onChangeText={field.onChange} placeholder="you@livegate.com" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <TextField label="Password" onChangeText={field.onChange} placeholder="Password" secureTextEntry value={field.value} />
          )}
        />
        <Text style={{ color: '#6E675C' }}>Current role: {preferredRole}</Text>
        {mutation.isError ? <Text style={{ color: '#A34734' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Signing in...' : 'Sign in'} />
      </Surface>
      <Button onPress={() => router.push('/(public)/forgot-password')} title="Forgot password" variant="ghost" />
    </Screen>
  );
}

export function SignUpScreen() {
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) =>
      mobileApi.signUp({ ...values, role: preferredRole }),
    onSuccess: (session) => {
      setSession(session);
      router.replace(nextPathForRole(session.user.role));
    },
  });

  return (
    <Screen>
      <Heading
        body="Create a serious LiveGate account with a clear role context from the first session."
        eyebrow="Auth"
        title="Create account"
      />
      <Surface>
        <Controller
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <TextField label="Full name" onChangeText={field.onChange} placeholder="Your full name" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField label="Email" onChangeText={field.onChange} placeholder="you@livegate.com" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <TextField label="Password" onChangeText={field.onChange} placeholder="Create password" secureTextEntry value={field.value} />
          )}
        />
        <Text style={{ color: '#6E675C' }}>Account role: {preferredRole}</Text>
        {mutation.isError ? <Text style={{ color: '#A34734' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Creating...' : 'Create account'} />
      </Surface>
    </Screen>
  );
}

export function ForgotPasswordScreen() {
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: mobileApi.forgotPassword,
  });

  return (
    <Screen>
      <Heading
        body="Request a password reset token through the real API."
        eyebrow="Recovery"
        title="Forgot password"
      />
      <Surface>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField label="Email" onChangeText={field.onChange} placeholder="you@livegate.com" value={field.value} />
          )}
        />
        {mutation.isSuccess ? <Text style={{ color: '#205C47' }}>{mutation.data.message}</Text> : null}
        {mutation.isError ? <Text style={{ color: '#A34734' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title="Send reset email" />
      </Surface>
    </Screen>
  );
}

export function ResetPasswordScreen() {
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', token: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: mobileApi.resetPassword,
  });

  return (
    <Screen>
      <Heading
        body="Complete password reset with a token from your backend."
        eyebrow="Recovery"
        title="Reset password"
      />
      <Surface>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField label="Email" onChangeText={field.onChange} placeholder="you@livegate.com" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="token"
          render={({ field }) => (
            <TextField label="Token" onChangeText={field.onChange} placeholder="Reset token" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <TextField label="New password" onChangeText={field.onChange} placeholder="New password" secureTextEntry value={field.value} />
          )}
        />
        {mutation.isSuccess ? <Text style={{ color: '#205C47' }}>{mutation.data.message}</Text> : null}
        {mutation.isError ? <Text style={{ color: '#A34734' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title="Update password" />
      </Surface>
    </Screen>
  );
}

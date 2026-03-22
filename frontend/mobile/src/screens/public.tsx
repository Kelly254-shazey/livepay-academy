import {
  demoParticipants,
  normalizeAuthSession,
  type DemoParticipant,
  type UserRole,
} from '@livegate/shared';
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

const publicModes = [
  {
    id: 'viewer',
    title: 'Viewer',
    body: 'Pay for lives, unlock premium content, and build a serious learning library.',
    roles: ['viewer'] as UserRole[],
    activeRole: 'viewer' as UserRole,
  },
  {
    id: 'creator',
    title: 'Creator',
    body: 'Host paid live sessions, publish premium content, and monetize classes.',
    roles: ['creator'] as UserRole[],
    activeRole: 'creator' as UserRole,
  },
  {
    id: 'hybrid',
    title: 'Viewer + Creator',
    body: 'Use one account for both audience and creator workflows, then switch role context later.',
    roles: ['viewer', 'creator'] as UserRole[],
    activeRole: 'viewer' as UserRole,
  },
] as const;

const onboardingHighlights = [
  {
    title: 'Paid live sessions',
    body: 'Creators define pricing while the backend enforces payment before entry.',
  },
  {
    title: 'Premium content and classes',
    body: 'Users unlock structured learning without a cluttered interface or confusing access state.',
  },
  {
    title: 'Hybrid identity',
    body: 'One account can behave like a viewer and creator, then switch context later.',
  },
] as const;

function nextPathForRole(role: UserRole) {
  if (role === 'creator') return '/(creator)/(tabs)/dashboard';
  if (role === 'admin' || role === 'moderator') return '/(staff)/dashboard';
  return '/(viewer)/(tabs)/home';
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

function DemoParticipantsPanel({
  title,
  participants,
  onUse,
}: {
  title: string;
  participants: DemoParticipant[];
  onUse: (participant: DemoParticipant) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#10211D' }}>{title}</Text>
      {participants.map((participant) => (
        <Surface key={participant.id}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#10211D' }}>
            {participant.fullName}
          </Text>
          <Text style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: '#60726C' }}>
            {participant.roleLabel}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>
            {participant.summary}
          </Text>
          <Button onPress={() => onUse(participant)} title={`Use ${participant.title}`} variant="secondary" />
        </Surface>
      ))}
    </View>
  );
}

export function SplashScreenView() {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 44, fontWeight: '700', color: '#10211D' }}>{brand.name}</Text>
        <Text style={{ fontSize: 16, lineHeight: 24, color: '#60726C' }}>{brand.tagline}</Text>
      </View>
    </Screen>
  );
}

export function OnboardingScreen() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);

  return (
    <Screen>
      <Heading
        body="LiveGate combines premium discovery, paid expertise, and structured learning into one restrained mobile experience."
        eyebrow="Onboarding"
        title="A serious home for paid live expertise."
      />
      <Surface>
        <Text style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', color: '#60726C' }}>
          What the app is built to do
        </Text>
        {onboardingHighlights.map((item) => (
          <View
            key={item.title}
            style={{
              borderRadius: 22,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
              backgroundColor: 'rgba(255,255,255,0.34)',
              padding: 16,
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#10211D' }}>{item.title}</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>{item.body}</Text>
          </View>
        ))}
      </Surface>
      {productRules.slice(0, 3).map((rule) => (
        <Surface key={rule}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#10211D' }}>{rule}</Text>
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
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);

  return (
    <Screen>
      <Heading
        body="Choose the public mode that should shape your first experience. Staff access uses a separate hidden portal."
        eyebrow="Mode"
        title="How are you using LiveGate?"
      />
      {publicModes.map((mode) => {
        const selected =
          preferredRoles.length === mode.roles.length &&
          mode.roles.every((role) => preferredRoles.includes(role));

        return (
          <Surface key={mode.id}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#10211D' }}>{mode.title}</Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: '#60726C' }}>{mode.body}</Text>
            <Button
              onPress={() => setPreferredRoles(mode.roles, mode.activeRole)}
              title={selected ? 'Selected' : `Use ${mode.title}`}
              variant={selected ? 'primary' : 'secondary'}
            />
          </Surface>
        );
      })}
      <Button onPress={() => router.push('/(public)/sign-up')} title="Continue to sign up" />
      <Button onPress={() => router.push('/(public)/sign-in')} title="I already have an account" variant="ghost" />
    </Screen>
  );
}

export function SignInScreen() {
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      mobileApi.signIn({ ...values, role: preferredRole, roles: preferredRoles }),
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      router.replace(nextPathForRole(normalized.user.role));
    },
  });

  const publicParticipants = demoParticipants.filter((participant) => participant.audience === 'public');

  return (
    <Screen>
      <Heading
        body="Sign in with a public viewer, creator, or hybrid account. Staff access is handled elsewhere."
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
        <Text style={{ color: '#60726C' }}>
          Selected mode: {preferredRoles.join(' + ')}
        </Text>
        {mutation.isError ? <Text style={{ color: '#A64B40' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Signing in...' : 'Sign in'} />
      </Surface>
      <DemoParticipantsPanel
        onUse={(participant) => {
          setPreferredRoles(participant.roles, participant.defaultRole);
          form.setValue('email', participant.email);
          form.setValue('password', participant.password);
        }}
        participants={publicParticipants}
        title="Demo participants"
      />
      <Button onPress={() => router.push('/(public)/forgot-password')} title="Forgot password" variant="ghost" />
    </Screen>
  );
}

export function SignUpScreen() {
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) =>
      mobileApi.signUp({ ...values, role: preferredRole, roles: preferredRoles }),
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      router.replace(nextPathForRole(normalized.user.role));
    },
  });

  return (
    <Screen>
      <Heading
        body="Create a public LiveGate account with viewer, creator, or hybrid access."
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
        <Text style={{ color: '#60726C' }}>
          Account mode: {preferredRoles.join(' + ')}
        </Text>
        {mutation.isError ? <Text style={{ color: '#A64B40' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Creating...' : 'Create account'} />
      </Surface>
    </Screen>
  );
}

export function StaffAccessScreen() {
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const staffParticipants = demoParticipants.filter((participant) => participant.audience === 'staff');

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) => {
      const participant = staffParticipants.find(
        (item) => item.email.toLowerCase() === values.email.toLowerCase(),
      );
      const role = participant?.defaultRole ?? 'moderator';
      return mobileApi.signIn({ ...values, role, roles: [role] });
    },
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, [session.user.role], session.user.role);
      setPreferredRoles([normalized.user.role], normalized.user.role);
      setSession(normalized);
      router.replace('/(staff)/dashboard');
    },
  });

  return (
    <Screen>
      <Heading
        body="Moderators and admins use this separate staff route. It is intentionally not part of the public onboarding path."
        eyebrow="Staff portal"
        title="Restricted access"
      />
      <Surface>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField label="Staff email" onChangeText={field.onChange} placeholder="staff@livegate.com" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <TextField label="Password" onChangeText={field.onChange} placeholder="Password" secureTextEntry value={field.value} />
          )}
        />
        {mutation.isError ? <Text style={{ color: '#A64B40' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Opening portal...' : 'Enter staff portal'} />
      </Surface>
      <DemoParticipantsPanel
        onUse={(participant) => {
          setPreferredRoles(participant.roles, participant.defaultRole);
          form.setValue('email', participant.email);
          form.setValue('password', participant.password);
        }}
        participants={staffParticipants}
        title="Staff demo accounts"
      />
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
        body="Request a password reset token through the real API or use demo recovery if the backend is offline."
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
        {mutation.isSuccess ? <Text style={{ color: '#196B59' }}>{mutation.data.message}</Text> : null}
        {mutation.isError ? <Text style={{ color: '#A64B40' }}>{(mutation.error as Error).message}</Text> : null}
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
        body="Complete password reset with a token from your backend or continue in demo mode."
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
        {mutation.isSuccess ? <Text style={{ color: '#196B59' }}>{mutation.data.message}</Text> : null}
        {mutation.isError ? <Text style={{ color: '#A64B40' }}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title="Update password" />
      </Surface>
    </Screen>
  );
}

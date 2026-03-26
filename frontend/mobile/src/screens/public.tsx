import {
  demoParticipants,
  normalizeAuthSession,
  type DemoParticipant,
  type UserRole,
} from '../shared';
import { brand, productRules } from '../shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { mobileApi } from '@/api/client';
import { Badge, Button, Heading, Screen, Surface, TextField, Dialog } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';
import { theme } from '@/theme';

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
    title: 'Content Creator',
    body: 'Host paid live sessions, publish premium content, and monetize classes.',
    roles: ['creator'] as UserRole[],
    activeRole: 'creator' as UserRole,
  },
  {
    id: 'hybrid',
    title: 'Viewer + Content Creator',
    body: 'Use one account for both audience and content creator workflows, then switch role context later.',
    roles: ['viewer', 'creator'] as UserRole[],
    activeRole: 'viewer' as UserRole,
  },
] as const;

const onboardingHighlights = [
  {
    title: 'Paid live sessions',
    body: 'Content creators define pricing while the backend enforces payment before entry.',
  },
  {
    title: 'Premium content and classes',
    body: 'Users unlock structured learning without a cluttered interface or confusing access state.',
  },
  {
    title: 'Hybrid identity',
    body: 'One account can behave like a viewer and content creator, then switch context later.',
  },
] as const;

function nextPathForRole(role: UserRole, roles: UserRole[] = [role]) {
  if (role === 'creator') return '/(creator)/(tabs)/dashboard';
  if (role === 'admin' || role === 'moderator') return '/(staff)/dashboard';
  return '/(viewer)/(tabs)/home';
}

function formatRoleLabel(role: UserRole) {
  if (role === 'creator') return 'Content Creator';
  if (role === 'viewer') return 'Viewer';
  if (role === 'moderator') return 'Moderator';
  if (role === 'admin') return 'Admin';
  return role;
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");
const genderSchema = z.enum(["male", "female", "prefer_not_to_say", "custom"]);

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().trim().min(3).max(32),
  dateOfBirth: dateSchema,
  gender: genderSchema,
  customGender: z.string().trim().max(80).optional(),
});

const emailVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
});

const profileCompletionSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().trim().min(3).max(32),
  dateOfBirth: dateSchema,
  gender: genderSchema,
  customGender: z.string().trim().max(80).optional(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
  password: z.string().min(8),
});

const googleSignInSchema = z.object({
  idToken: z.string().min(20),
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
      <Text style={styles.panelTitle}>{title}</Text>
      {participants.map((participant) => (
        <Surface key={participant.id} style={styles.demoCard}>
          <Badge variant="primary">{participant.roleLabel.replace(/Creator/g, 'Content Creator')}</Badge>
          <Text style={styles.demoName}>{participant.fullName}</Text>
          <Text style={styles.demoSummary}>{participant.summary}</Text>
          <Button onPress={() => onUse(participant)} title={`Use ${participant.title}`} variant="secondary" />
        </Surface>
      ))}
    </View>
  );
}

function AuthDialogIntro({
  eyebrow,
  body,
}: {
  eyebrow: string;
  body: string;
}) {
  return (
    <View style={styles.authDialogIntro}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.authDialogBody}>{body}</Text>
    </View>
  );
}

export function SplashScreenView() {
  return (
    <Screen>
      <View style={styles.splashWrap}>
        <Badge variant="primary">Premium live learning</Badge>
        <Text style={styles.splashTitle}>{brand.name}</Text>
        <Text style={styles.splashBody}>{brand.tagline}</Text>
      </View>
    </Screen>
  );
}

export function OnboardingScreen() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);

  return (
    <Screen>
      <Heading title="Welcome to LiveGate" />
      <Surface>
        <Text style={styles.sectionEyebrow}>
          What the app is built to do
        </Text>
        {onboardingHighlights.map((item) => (
          <View
            key={item.title}
            style={styles.highlightCard}
          >
            <Text style={styles.highlightTitle}>{item.title}</Text>
            <Text style={styles.highlightBody}>{item.body}</Text>
          </View>
        ))}
      </Surface>
      {productRules.slice(0, 3).map((rule) => (
        <Surface key={rule} style={styles.ruleCard}>
          <Text style={styles.ruleText}>{rule}</Text>
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

function SignInFormDialogContent({
  onSuccess,
  onOpenSignUp,
}: {
  onSuccess: () => void;
  onOpenSignUp: () => void;
}) {
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      mobileApi.signIn({ ...values, role: preferredRole, roles: preferredRoles }),
    onSuccess: (session) => {
      if (session) {
        const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
        setSession(normalized);
        onSuccess();
        router.replace(nextPathForRole(normalized.user.role, normalized.user.roles));
      }
    },
  });

  return (
    <View style={{ gap: 12 }}>
      <AuthDialogIntro
        eyebrow="Welcome back"
        body="Sign in with the email and password for the mode you selected below."
      />
      <Controller
        control={form.control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            onChangeText={field.onChange}
            placeholder="you@livegate.com"
            value={field.value}
            error={form.formState.errors.email?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Password"
            onChangeText={field.onChange}
            placeholder="Password"
            secureTextEntry
            value={field.value}
            error={form.formState.errors.password?.message}
          />
        )}
      />
      <Text style={styles.statusText}>
        Selected mode: {preferredRoles.map(formatRoleLabel).join(' + ')}
      </Text>
      {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
      <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Signing in...' : 'Sign in'} />
      <View style={styles.authDialogActions}>
        <Button
          onPress={() => {
            onSuccess();
            router.push('/(public)/forgot-password');
          }}
          title="Forgot password"
          variant="ghost"
        />
        <Button onPress={onOpenSignUp} title="Need an account? Sign up" variant="secondary" />
      </View>
    </View>
  );
}

function SignUpFormDialogContent({
  onSuccess,
  onOpenSignIn,
}: {
  onSuccess: () => void;
  onOpenSignIn: () => void;
}) {
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const [showGenderCustom, setShowGenderCustom] = React.useState(false);
  
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
      fullName: '', 
      email: '', 
      password: '',
      username: '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      customGender: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) =>
      mobileApi.signUp({ 
        ...values, 
        role: preferredRole, 
        roles: preferredRoles 
      }),
    onSuccess: (session) => {
      if (session) {
        const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
        setSession(normalized);
        if (normalized.user.emailVerified) {
          onSuccess();
          router.replace(nextPathForRole(normalized.user.role, normalized.user.roles));
        } else {
          onSuccess();
          router.replace('/(public)/email-verification');
        }
      }
    },
  });

  return (
    <View style={{ gap: 12 }}>
      <AuthDialogIntro
        eyebrow="Create your account"
        body="Finish the form below to open a viewer, creator, or hybrid LiveGate account."
      />
      <Controller
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <TextField
            label="Full name"
            onChangeText={field.onChange}
            placeholder="Your full name"
            value={field.value}
            error={form.formState.errors.fullName?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="username"
        render={({ field }) => (
          <TextField
            label="Username"
            onChangeText={field.onChange}
            placeholder="Unique username"
            value={field.value}
            error={form.formState.errors.username?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            onChangeText={field.onChange}
            placeholder="you@livegate.com"
            value={field.value}
            error={form.formState.errors.email?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Password"
            onChangeText={field.onChange}
            placeholder="Create password"
            secureTextEntry
            value={field.value}
            error={form.formState.errors.password?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="dateOfBirth"
        render={({ field }) => (
          <TextField
            label="Date of birth"
            onChangeText={field.onChange}
            placeholder="YYYY-MM-DD"
            value={field.value}
            error={form.formState.errors.dateOfBirth?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="gender"
        render={({ field }) => (
          <View style={{ gap: 8 }}>
            <Text style={styles.statusText}>Gender</Text>
            <View style={{ gap: 8 }}>
              {(['male', 'female', 'prefer_not_to_say', 'custom'] as const).map((option) => (
                <Button
                  key={option}
                  onPress={() => {
                    field.onChange(option);
                    setShowGenderCustom(option === 'custom');
                  }}
                  title={option === 'male' ? 'Male' : option === 'female' ? 'Female' : option === 'prefer_not_to_say' ? 'Prefer not to say' : 'Custom'}
                  variant={field.value === option ? 'primary' : 'secondary'}
                />
              ))}
            </View>
          </View>
        )}
      />
      {showGenderCustom && (
        <Controller
          control={form.control}
          name="customGender"
          render={({ field }) => (
            <TextField
              label="Please specify"
              onChangeText={field.onChange}
              placeholder="Your gender identity"
              value={field.value ?? ''}
              error={form.formState.errors.customGender?.message}
            />
          )}
        />
      )}
      <Text style={styles.statusText}>
        Account mode: {preferredRoles.map(formatRoleLabel).join(' + ')}
      </Text>
      {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
      <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Creating account...' : 'Create account'} />
      <View style={styles.authDialogActions}>
        <Button onPress={onOpenSignIn} title="Already have an account? Sign in" variant="secondary" />
      </View>
    </View>
  );
}

export function RoleSelectionScreen() {
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const [activeDialog, setActiveDialog] = React.useState<'signIn' | 'signUp' | null>(null);

  return (
    <Screen>
      <View style={styles.roleHero}>
        <View style={styles.roleHeroBackdropTop} />
        <View style={styles.roleHeroBackdropBottom} />
        <View style={styles.roleHeroHeader}>
          <Badge variant="primary">Live now</Badge>
          <Badge variant="default">For you</Badge>
        </View>
        <View style={styles.roleHeroFeed}>
          <View style={[styles.roleHeroTile, styles.roleHeroTilePrimary]}>
            <Text style={styles.roleHeroTileKicker}>Trending stream</Text>
            <Text style={styles.roleHeroTileTitle}>Content creator drop-ins, premium rooms, and bite-size discovery.</Text>
          </View>
          <View style={styles.roleHeroAside}>
            <View style={[styles.roleHeroTile, styles.roleHeroTileSmall]}>
              <Text style={styles.roleHeroMetric}>24/7</Text>
              <Text style={styles.roleHeroTileCaption}>Discovery rhythm</Text>
            </View>
            <View style={[styles.roleHeroTile, styles.roleHeroTileSmall, styles.roleHeroTileAccent]}>
              <Text style={styles.roleHeroMetric}>1 tap</Text>
              <Text style={styles.roleHeroTileCaption}>Switch roles later</Text>
            </View>
          </View>
        </View>
      </View>

      <Surface style={styles.roleIntroCard}>
        <Text style={styles.sectionEyebrow}>Mode</Text>
        <Text style={styles.roleIntroTitle}>How are you using LiveGate?</Text>
        <Text style={styles.roleIntroBody}>
          Choose the public mode that should shape your first experience.
        </Text>
      </Surface>
      {publicModes.map((mode) => {
        const selected =
          preferredRoles.length === mode.roles.length &&
          mode.roles.every((role) => preferredRoles.includes(role));

        return (
          <Surface key={mode.id} style={selected ? styles.modeCardActive : undefined}>
            <Badge variant={selected ? 'primary' : 'default'}>{selected ? 'Selected' : 'Mode'}</Badge>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeBody}>{mode.body}</Text>
            <Button
              onPress={() => setPreferredRoles(mode.roles, mode.activeRole)}
              title={selected ? 'Selected' : `Use ${mode.title}`}
              variant={selected ? 'primary' : 'secondary'}
            />
          </Surface>
        );
      })}
      <Button onPress={() => setActiveDialog('signUp')} title="Create account" />
      <Button onPress={() => setActiveDialog('signIn')} title="Sign in" variant="ghost" />

      <Dialog
        visible={activeDialog === 'signUp'}
        onClose={() => setActiveDialog(null)}
        title="Create your account"
      >
        <SignUpFormDialogContent
          onSuccess={() => setActiveDialog(null)}
          onOpenSignIn={() => setActiveDialog('signIn')}
        />
      </Dialog>

      <Dialog
        visible={activeDialog === 'signIn'}
        onClose={() => setActiveDialog(null)}
        title="Sign in to LiveGate"
      >
        <SignInFormDialogContent
          onSuccess={() => setActiveDialog(null)}
          onOpenSignUp={() => setActiveDialog('signUp')}
        />
      </Dialog>
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
      if (session) {
        const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
        setSession(normalized);
        router.replace(nextPathForRole(normalized.user.role, normalized.user.roles));
      }
    },
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      // TODO: Integrate with actual Google Sign-In provider
      alert('Google sign-in requires @react-native-google-signin/google-signin package.\nInstall it with: npm install @react-native-google-signin/google-signin');
      throw new Error('Google sign-in not configured');
    },
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      router.replace(nextPathForRole(normalized.user.role, normalized.user.roles));
    },
  });

  const publicParticipants = demoParticipants.filter((participant) => participant.audience === 'public');

  return (
    <Screen>
      <Heading title="Sign in" />
      <Surface>
        <Text style={styles.sectionEyebrow}>Quick sign-in</Text>
        <Button 
          onPress={() => googleMutation.mutate()} 
          title={googleMutation.isPending ? 'Signing in with Google...' : 'Continue with Google'} 
          variant="secondary"
        />
        <Text style={styles.dividerText}>or</Text>
        
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
        <Text style={styles.statusText}>
          Selected mode: {preferredRoles.map(formatRoleLabel).join(' + ')}
        </Text>
        {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
        {googleMutation.isError ? <Text style={styles.errorText}>{(googleMutation.error as Error).message}</Text> : null}
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
  const [showGenderCustom, setShowGenderCustom] = React.useState(false);
  
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
      fullName: '', 
      email: '', 
      password: '',
      username: '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      customGender: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) =>
      mobileApi.signUp({ 
        ...values, 
        role: preferredRole, 
        roles: preferredRoles 
      }),
    onSuccess: (session) => {
      if (session) {
        const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
        setSession(normalized);
        if (normalized.user.emailVerified) {
          router.replace(nextPathForRole(normalized.user.role, normalized.user.roles));
        } else {
          router.replace('/(public)/email-verification');
        }
      }
    },
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      // TODO: Integrate with actual Google Sign-In provider (@react-native-google-signin/google-signin)
      alert('Google sign-in requires @react-native-google-signin/google-signin package.\nInstall it with: npm install @react-native-google-signin/google-signin');
      throw new Error('Google sign-in not configured');
    },
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      router.replace(nextPathForRole(normalized.user.role, normalized.user.roles));
    },
  });

  return (
    <Screen>
      <Heading title="Create account" />
      <Surface>
        <Text style={styles.sectionEyebrow}>Quick sign-up</Text>
        <Button 
          onPress={() => googleMutation.mutate()} 
          title={googleMutation.isPending ? 'Signing up with Google...' : 'Continue with Google'} 
          variant="secondary"
        />
        <Text style={styles.dividerText}>or</Text>
        <Text style={styles.sectionEyebrow}>Standard registration</Text>
        
        <Controller
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <TextField label="Full name" onChangeText={field.onChange} placeholder="Your full name" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="username"
          render={({ field }) => (
            <TextField label="Username" onChangeText={field.onChange} placeholder="Unique username" value={field.value} />
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
        <Controller
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <TextField label="Date of birth" onChangeText={field.onChange} placeholder="YYYY-MM-DD" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="gender"
          render={({ field }) => (
            <View style={{ gap: 8 }}>
              <Text style={styles.statusText}>Gender</Text>
              <View style={{ gap: 8 }}>
                {(['male', 'female', 'prefer_not_to_say', 'custom'] as const).map((option) => (
                  <Button
                    key={option}
                    onPress={() => {
                      field.onChange(option);
                      setShowGenderCustom(option === 'custom');
                    }}
                    title={option === 'male' ? 'Male' : option === 'female' ? 'Female' : option === 'prefer_not_to_say' ? 'Prefer not to say' : 'Custom'}
                    variant={field.value === option ? 'primary' : 'secondary'}
                  />
                ))}
              </View>
            </View>
          )}
        />
        {showGenderCustom && (
          <Controller
            control={form.control}
            name="customGender"
            render={({ field }) => (
              <TextField label="Please specify" onChangeText={field.onChange} placeholder="Your gender identity" value={field.value ?? ''} />
            )}
          />
        )}
        <Text style={styles.statusText}>
          Account mode: {preferredRoles.map(formatRoleLabel).join(' + ')}
        </Text>
        {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
        {googleMutation.isError ? <Text style={styles.errorText}>{(googleMutation.error as Error).message}</Text> : null}
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
      if (session) {
        const normalized = normalizeAuthSession(session, [session.user.role], session.user.role);
        setPreferredRoles([normalized.user.role], normalized.user.role);
        setSession(normalized);
        router.replace('/(staff)/dashboard');
      }
    },
  });

  return (
    <Screen>
      <Heading title="Restricted access" />
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
        {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
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
      <Heading title="Forgot password" />
      <Surface>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField label="Email" onChangeText={field.onChange} placeholder="you@livegate.com" value={field.value} />
          )}
        />
        {mutation.isSuccess ? <Text style={styles.successText}>{mutation.data?.message}</Text> : null}
      </Surface>
    </Screen>
  );
}

export function ResetPasswordScreen() {
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', code: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: mobileApi.resetPassword,
  });

  return (
    <Screen>
      <Heading title="Reset password" />
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
          name="code"
          render={({ field }) => (
            <TextField label="Verification code" onChangeText={field.onChange} placeholder="000000" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <TextField label="New password" onChangeText={field.onChange} placeholder="New password" secureTextEntry value={field.value} />
          )}
        />
        {mutation.isSuccess ? <Text style={styles.successText}>{mutation.data?.message}</Text> : null}
      </Surface>
    </Screen>
  );
}

export function EmailVerificationScreen() {
  const { session } = useSessionStore();
  const form = useForm<z.infer<typeof emailVerificationSchema>>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { email: session?.user.email || '', code: '' },
  });

  const mutation = useMutation({
    mutationFn: mobileApi.confirmEmailVerification,
    onSuccess: () => {
      router.replace('/(viewer)/(tabs)/home');
    },
  });

  return (
    <Screen>
      <Heading title="Verify email" />
      <Surface>
        <Text style={styles.statusText}>
          We sent a 6-digit code to {form.getValues('email')}
        </Text>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <TextField label="Email" onChangeText={field.onChange} value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="code"
          render={({ field }) => (
            <TextField label="Verification code" onChangeText={field.onChange} placeholder="000000" value={field.value ?? ''} />
          )}
        />
        {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Verifying...' : 'Verify email'} />
      </Surface>
    </Screen>
  );
}

export function ProfileCompletionScreen() {
  const { session } = useSessionStore();
  const setSession = useSessionStore((state) => state.setSession);
  const [showGenderCustom, setShowGenderCustom] = React.useState(false);
  
  const form = useForm<z.infer<typeof profileCompletionSchema>>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      fullName: session?.user.fullName || '',
      username: session?.user.username || '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      customGender: '',
    },
  });

  const mutation = useMutation({
    mutationFn: mobileApi.completeProfile,
    onSuccess: (updatedSession) => {
      const normalized = normalizeAuthSession(updatedSession, session?.user.roles || [], session?.user.role);
      setSession(normalized);
      if (session?.user.role === 'creator') {
        router.replace('/(creator)/(tabs)/dashboard');
      } else {
        router.replace('/(viewer)/(tabs)/home');
      }
    },
  });

  return (
    <Screen>
      <Heading title="Complete your profile" />
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
          name="username"
          render={({ field }) => (
            <TextField label="Username" onChangeText={field.onChange} placeholder="Unique username" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <TextField label="Date of birth" onChangeText={field.onChange} placeholder="YYYY-MM-DD" value={field.value} />
          )}
        />
        <Controller
          control={form.control}
          name="gender"
          render={({ field }) => (
            <View style={{ gap: 8 }}>
              <Text style={styles.statusText}>Gender</Text>
              <View style={{ gap: 8 }}>
                {(['male', 'female', 'prefer_not_to_say', 'custom'] as const).map((option) => (
                  <Button
                    key={option}
                    onPress={() => {
                      field.onChange(option);
                      setShowGenderCustom(option === 'custom');
                    }}
                    title={option === 'male' ? 'Male' : option === 'female' ? 'Female' : option === 'prefer_not_to_say' ? 'Prefer not to say' : 'Custom'}
                    variant={field.value === option ? 'primary' : 'secondary'}
                  />
                ))}
              </View>
            </View>
          )}
        />
        {showGenderCustom && (
          <Controller
            control={form.control}
            name="customGender"
            render={({ field }) => (
              <TextField label="Please specify" onChangeText={field.onChange} placeholder="Your gender identity" value={field.value ?? ''} />
            )}
          />
        )}
        {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Saving...' : 'Complete profile'} />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  splashWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing['4xl'],
  },
  splashTitle: {
    fontSize: theme.typography.sizes['5xl'],
    lineHeight: 54,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.displayFontFamily,
  },
  splashBody: {
    fontSize: theme.typography.sizes.lg,
    lineHeight: 28,
    color: theme.colors.textSecondary,
    maxWidth: 320,
  },
  roleHero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: '#beded6',
    backgroundColor: '#10211d',
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    minHeight: 230,
    ...theme.shadow.lg,
  },
  roleHeroBackdropTop: {
    position: 'absolute',
    top: -30,
    right: -10,
    width: 170,
    height: 170,
    borderRadius: theme.radius.pill,
    backgroundColor: '#1f8a70',
    opacity: 0.28,
  },
  roleHeroBackdropBottom: {
    position: 'absolute',
    bottom: -45,
    left: -20,
    width: 220,
    height: 150,
    borderRadius: theme.radius.pill,
    backgroundColor: '#2dd4bf',
    opacity: 0.18,
  },
  roleHeroHeader: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  roleHeroFeed: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'stretch',
  },
  roleHeroTile: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  roleHeroTilePrimary: {
    flex: 1.35,
    minHeight: 128,
  },
  roleHeroAside: {
    flex: 0.95,
    gap: theme.spacing.md,
  },
  roleHeroTileSmall: {
    flex: 1,
    minHeight: 58,
  },
  roleHeroTileAccent: {
    backgroundColor: 'rgba(216,235,229,0.16)',
  },
  roleHeroTileKicker: {
    fontSize: theme.typography.sizes.xs,
    color: '#bdeee4',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: theme.typography.weights.medium,
  },
  roleHeroTileTitle: {
    fontSize: theme.typography.sizes.xl,
    lineHeight: 29,
    color: '#fffaf2',
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.displayFontFamily,
  },
  roleHeroMetric: {
    fontSize: theme.typography.sizes['2xl'],
    color: '#fffaf2',
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.displayFontFamily,
  },
  roleHeroTileCaption: {
    fontSize: theme.typography.sizes.sm,
    color: '#d6e6df',
    lineHeight: 20,
  },
  roleIntroCard: {
    backgroundColor: theme.colors.surface,
  },
  roleIntroTitle: {
    fontSize: theme.typography.sizes['3xl'],
    lineHeight: 38,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.displayFontFamily,
  },
  roleIntroBody: {
    fontSize: theme.typography.sizes.base,
    lineHeight: 25,
    color: theme.colors.textSecondary,
  },
  panelTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    fontFamily: theme.typography.displayFontFamily,
  },
  authDialogIntro: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  authDialogBody: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  authDialogActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  demoCard: {
    backgroundColor: theme.colors.surface,
  },
  demoName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  demoSummary: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  sectionEyebrow: {
    fontSize: theme.typography.sizes.xs,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.colors.accent,
    fontWeight: theme.typography.weights.medium,
  },
  highlightCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#d8ede7',
    backgroundColor: '#eef8f4',
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  highlightTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  highlightBody: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  ruleCard: {
    backgroundColor: theme.colors.surface,
  },
  ruleText: {
    fontSize: theme.typography.sizes.base,
    lineHeight: 24,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
  },
  modeCardActive: {
    borderColor: '#b3ddd3',
    backgroundColor: '#f5fbf9',
  },
  modeTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    fontFamily: theme.typography.displayFontFamily,
  },
  modeBody: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
  },
  successText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.medium,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.danger,
    fontWeight: theme.typography.weights.medium,
  },
  dividerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
    fontWeight: theme.typography.weights.medium,
  },
});

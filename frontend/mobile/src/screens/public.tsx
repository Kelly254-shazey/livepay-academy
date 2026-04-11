import {
  demoParticipants,
  normalizeAuthSession,
  type AuthSession,
  type DemoParticipant,
  type UserRole,
} from '../shared';
import { brand, productRules } from '../shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { z } from 'zod';
import { mobileApi } from '@/api/client';
import { Dialog, Screen } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';
import { theme } from '@/theme';
import {
  getGoogleSignInHelpText,
  initializeGoogleSignIn,
  isGoogleSignInConfigured,
  signInWithGoogle,
} from '@/utils/google-signin';

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
    body: 'Choose a blended onboarding intent. LiveGate still enforces whichever roles are actually enabled on your account.',
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

const validAuthRoles: UserRole[] = ['viewer', 'creator', 'moderator', 'admin'];

function normalizePreferredRole(
  role: unknown,
  fallback: UserRole = 'viewer',
): UserRole {
  return validAuthRoles.includes(role as UserRole) ? (role as UserRole) : fallback;
}

function normalizePreferredRoles(
  roles: unknown,
  fallbackRole: UserRole = 'viewer',
): UserRole[] {
  const source = Array.isArray(roles) ? roles : [roles];
  const normalized = Array.from(
    new Set(
      source.filter((item): item is UserRole =>
        validAuthRoles.includes(item as UserRole),
      ),
    ),
  );

  return normalized.length ? normalized : [fallbackRole];
}

function nextPathForRole(role: UserRole, roles?: UserRole[]) {
  void roles;
  if (role === 'creator') return '/(creator)/(tabs)/dashboard';
  if (role === 'admin' || role === 'moderator') return '/(staff)/dashboard';
  return '/(viewer)/(tabs)/home';
}

function getPostAuthRoute(session: AuthSession) {
  if (session.nextStep === 'verify-email') {
    return '/(public)/email-verification';
  }

  if (session.nextStep === 'complete-profile') {
    return '/(public)/profile-completion';
  }

  return nextPathForRole(session.user.role, session.user.roles);
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
const countrySchema = z.string().min(2, 'Select a country').max(2);
const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol.');

const signInSchema = z.object({
  identifier: z.string().trim().min(3).max(160),
  password: z.string().min(1).max(256),
});

const signUpSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
    username: z.string().trim().min(3).max(32),
    dateOfBirth: dateSchema,
    gender: genderSchema,
    customGender: z.string().trim().max(80).optional(),
    country: countrySchema,
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      });
    }
    if (values.gender === 'custom' && !values.customGender?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customGender'],
        message: 'Tell us how you identify.',
      });
    }
  });

const emailVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
});

const profileCompletionSchema = z
  .object({
    fullName: z.string().min(2),
    username: z.string().trim().min(3).max(32),
    dateOfBirth: dateSchema,
    gender: genderSchema,
    customGender: z.string().trim().max(80).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.gender === 'custom' && !values.customGender?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customGender'],
        message: 'Tell us how you identify.',
      });
    }
  });

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
  password: passwordSchema,
});

const googleSignInSchema = z.object({
  idToken: z.string().min(20),
});

const publicPalette = {
  background: '#f4f7fb',
  surface: '#ffffff',
  surfaceMuted: '#eef4fa',
  surfaceAccent: '#e0f2fe',
  infoSoft: '#dbeafe',
  border: '#d7e3f0',
  borderSubtle: '#e5edf6',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  accent: '#0ea5e9',
  success: '#059669',
  danger: '#dc2626',
};

function PublicScreen({ children }: { children: React.ReactNode }) {
  return <Screen style={styles.publicScreen}>{children}</Screen>;
}

function PublicSurface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.publicSurface, style]}>{children}</View>;
}

function PublicHeading({
  title,
  eyebrow,
  body,
}: {
  title: string;
  eyebrow?: string;
  body?: string;
}) {
  return (
    <View style={styles.publicHeadingContainer}>
      {eyebrow ? <Text style={styles.publicEyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.publicTitle}>{title}</Text>
      {body ? <Text style={styles.publicBody}>{body}</Text> : null}
    </View>
  );
}

function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}) {
  return (
    <View
      style={[
        styles.publicBadge,
        variant === 'primary' ? styles.publicBadgePrimary : styles.publicBadgeDefault,
      ]}
    >
      <Text
        style={[
          styles.publicBadgeText,
          variant === 'primary' ? styles.publicBadgeTextPrimary : styles.publicBadgeTextDefault,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function Button({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
}: {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.publicButton,
        isPrimary && styles.publicButtonPrimary,
        isGhost && styles.publicButtonGhost,
        isDanger && styles.publicButtonDanger,
        !isPrimary && !isGhost && !isDanger && styles.publicButtonSecondary,
        disabled && styles.publicButtonDisabled,
      ]}
    >
      <Text
        style={[
          styles.publicButtonText,
          isPrimary && styles.publicButtonTextPrimary,
          isGhost && styles.publicButtonTextGhost,
          isDanger && styles.publicButtonTextPrimary,
          !isPrimary && !isGhost && !isDanger && styles.publicButtonTextSecondary,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  inputMode,
  maxLength,
}: {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  inputMode?: React.ComponentProps<typeof TextInput>['inputMode'];
  maxLength?: number;
}) {
  return (
    <View style={styles.publicTextFieldContainer}>
      {label ? <Text style={styles.publicTextFieldLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.publicTextInput, error ? styles.publicTextInputError : null]}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={publicPalette.textMuted}
        secureTextEntry={secureTextEntry}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

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
        <PublicSurface key={participant.id} style={styles.demoCard}>
          <Badge variant="primary">{participant.roleLabel.replace(/Creator/g, 'Content Creator')}</Badge>
          <Text style={styles.demoName}>{participant.fullName}</Text>
          <Text style={styles.demoSummary}>{participant.summary}</Text>
          <Button onPress={() => onUse(participant)} title={`Use ${participant.title}`} variant="secondary" />
        </PublicSurface>
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
    <PublicScreen>
      <View style={styles.splashWrap}>
        <Badge variant="primary">Premium live learning</Badge>
        <Text style={styles.splashTitle}>{brand.name}</Text>
        <Text style={styles.splashBody}>{brand.tagline}</Text>
      </View>
    </PublicScreen>
  );
}

export function OnboardingScreen() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);

  return (
    <PublicScreen>
      <PublicHeading title="Welcome to LiveGate" />
      <PublicSurface>
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
      </PublicSurface>
      {productRules.slice(0, 3).map((rule) => (
        <PublicSurface key={rule} style={styles.ruleCard}>
          <Text style={styles.ruleText}>{rule}</Text>
        </PublicSurface>
      ))}
      <Button
        onPress={() => {
          completeOnboarding();
          router.replace('/(public)/role-selection');
        }}
        title="Continue"
      />
    </PublicScreen>
  );
}

function SignInFormDialogContent({
  onSuccess,
  onOpenSignUp,
}: {
  onSuccess: () => void;
  onOpenSignUp: () => void;
}) {
  const rawPreferredRole = useSessionStore((state) => state.preferredRole);
  const rawPreferredRoles = useSessionStore((state) => state.preferredRoles);
  const preferredRole = normalizePreferredRole(rawPreferredRole);
  const preferredRoles = normalizePreferredRoles(rawPreferredRoles, preferredRole);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      mobileApi.signIn({ ...values, role: preferredRole, roles: preferredRoles }),
    onSuccess: (session) => {
      if (session) {
        const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
        setSession(normalized);
        onSuccess();
        router.replace(getPostAuthRoute(normalized));
      }
    },
  });

  return (
    <View style={{ gap: 12 }}>
      <AuthDialogIntro
        eyebrow="Welcome back"
        body="Sign in with the email address or username for the mode you selected below."
      />
      <Controller
        control={form.control}
        name="identifier"
        render={({ field }) => (
          <TextField
            label="Email or username"
            onChangeText={field.onChange}
            placeholder="you@livegate.com or username"
            value={field.value}
            error={form.formState.errors.identifier?.message}
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
  const rawPreferredRole = useSessionStore((state) => state.preferredRole);
  const rawPreferredRoles = useSessionStore((state) => state.preferredRoles);
  const preferredRole = normalizePreferredRole(rawPreferredRole);
  const preferredRoles = normalizePreferredRoles(rawPreferredRoles, preferredRole);
  const setSession = useSessionStore((state) => state.setSession);
  const [showGenderCustom, setShowGenderCustom] = React.useState(false);
  
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
      fullName: '', 
      email: '', 
      password: '',
      confirmPassword: '',
      username: '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      customGender: '',
      country: '',
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
        onSuccess();
        router.replace(getPostAuthRoute(normalized));
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
          <View style={{ gap: 4 }}>
            <TextField
              label="Password (12+ characters)"
              onChangeText={field.onChange}
              placeholder="Create password"
              secureTextEntry
              value={field.value}
              error={form.formState.errors.password?.message}
            />
            <Text style={{ fontSize: 11, color: '#666', paddingHorizontal: 12 }}>
              • At least 12 chars • 1 uppercase • 1 lowercase • 1 number • 1 symbol
            </Text>
          </View>
        )}
      />
      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            label="Confirm Password"
            onChangeText={field.onChange}
            placeholder="Confirm password"
            secureTextEntry
            value={field.value}
            error={form.formState.errors.confirmPassword?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="dateOfBirth"
        render={({ field }) => (
          <TextField
            label="Date of birth (YYYY-MM-DD)"
            onChangeText={field.onChange}
            placeholder="Use calendar: 2000-01-15"
            value={field.value}
            error={form.formState.errors.dateOfBirth?.message}
            inputMode="numeric"
          />
        )}
      />
      <Controller
        control={form.control}
        name="country"
        render={({ field }) => (
          <View style={{ gap: 8 }}>
            <Text style={styles.statusText}>Country (for currency)</Text>
            <TextField
              label="Country Code"
              onChangeText={(text) => field.onChange(text.toUpperCase())}
              placeholder="US, GB, CA, etc."
              value={field.value}
              error={form.formState.errors.country?.message}
              maxLength={2}
            />
          </View>
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
  const rawPreferredRole = useSessionStore((state) => state.preferredRole);
  const rawPreferredRoles = useSessionStore((state) => state.preferredRoles);
  const preferredRole = normalizePreferredRole(rawPreferredRole);
  const preferredRoles = normalizePreferredRoles(rawPreferredRoles, preferredRole);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const [activeDialog, setActiveDialog] = React.useState<'signIn' | 'signUp' | null>(null);
  const { width } = useWindowDimensions();
  const compactHeroLayout = width < 390;
  const useFullScreenAuth = width < 768;

  function openSignUp() {
    if (useFullScreenAuth) {
      router.push('/(public)/sign-up');
      return;
    }

    setActiveDialog('signUp');
  }

  function openSignIn() {
    if (useFullScreenAuth) {
      router.push('/(public)/sign-in');
      return;
    }

    setActiveDialog('signIn');
  }

  return (
    <PublicScreen>
      <View style={styles.roleHero}>
        <View style={styles.roleHeroBackdropTop} />
        <View style={styles.roleHeroBackdropBottom} />
        <View style={styles.roleHeroHeader}>
          <Badge variant="primary">Live now</Badge>
          <Badge variant="default">For you</Badge>
        </View>
        <View style={[styles.roleHeroFeed, compactHeroLayout && styles.roleHeroFeedCompact]}>
          <View style={[styles.roleHeroTile, styles.roleHeroTilePrimary]}>
            <Text style={styles.roleHeroTileKicker}>Trending stream</Text>
            <Text style={styles.roleHeroTileTitle}>Content creator drop-ins, premium rooms, and bite-size discovery.</Text>
          </View>
          <View style={[styles.roleHeroAside, compactHeroLayout && styles.roleHeroAsideCompact]}>
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

      <PublicSurface style={styles.roleIntroCard}>
        <Text style={styles.sectionEyebrow}>Mode</Text>
        <Text style={styles.roleIntroTitle}>How are you using LiveGate?</Text>
        <Text style={styles.roleIntroBody}>
          Choose the public mode that should shape your first experience.
        </Text>
      </PublicSurface>
      {publicModes.map((mode) => {
        const selected =
          preferredRoles.length === mode.roles.length &&
          mode.roles.every((role) => preferredRoles.includes(role));

        return (
          <PublicSurface key={mode.id} style={selected ? styles.modeCardActive : undefined}>
            <Badge variant={selected ? 'primary' : 'default'}>{selected ? 'Selected' : 'Mode'}</Badge>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeBody}>{mode.body}</Text>
            <Button
              onPress={() => setPreferredRoles(mode.roles, mode.activeRole)}
              title={selected ? 'Selected' : `Use ${mode.title}`}
              variant={selected ? 'primary' : 'secondary'}
            />
          </PublicSurface>
        );
      })}
      <Button onPress={openSignUp} title="Create account" />
      <Button onPress={openSignIn} title="Sign in" variant="ghost" />
      {useFullScreenAuth ? (
        <Text style={styles.authEntryNote}>
          Auth opens full screen on phones so every field stays visible.
        </Text>
      ) : null}
      <Button onPress={() => router.replace('/(public)/onboarding')} title="Back to welcome" variant="secondary" />

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
    </PublicScreen>
  );
}

export function SignInScreen() {
  const rawPreferredRole = useSessionStore((state) => state.preferredRole);
  const rawPreferredRoles = useSessionStore((state) => state.preferredRoles);
  const preferredRole = normalizePreferredRole(rawPreferredRole);
  const preferredRoles = normalizePreferredRoles(rawPreferredRoles, preferredRole);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const googleConfigured = isGoogleSignInConfigured();
  const googleHelpText = getGoogleSignInHelpText();
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  React.useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      mobileApi.signIn({ ...values, role: preferredRole, roles: preferredRoles }),
    onSuccess: (session) => {
      if (session) {
        const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
        setSession(normalized);
        router.replace(getPostAuthRoute(normalized));
      }
    },
  });
  const googleMutation = useMutation({
    mutationFn: async () => {
      const result = await signInWithGoogle();
      return mobileApi.signInWithGoogle({
        idToken: result.idToken,
        role: preferredRole,
        roles: preferredRoles,
      });
    },
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      router.replace(getPostAuthRoute(normalized));
    },
  });

  const publicParticipants = demoParticipants.filter((participant) => participant.audience === 'public');

  return (
    <PublicScreen>
      <PublicHeading
        title="Sign in"
        eyebrow="Account access"
        body="Use the email address or username linked to the mode you selected."
      />
      <PublicSurface>
        <Text style={styles.sectionEyebrow}>Google sign-in</Text>
        <Button
          onPress={() => googleMutation.mutate()}
          title={googleMutation.isPending ? 'Connecting Google...' : 'Continue with Google'}
          variant="secondary"
          disabled={!googleConfigured || googleMutation.isPending}
        />
        <Text style={styles.statusText}>{googleHelpText}</Text>
        {googleMutation.isError ? (
          <Text style={styles.errorText}>{(googleMutation.error as Error).message}</Text>
        ) : null}
        <Text style={styles.dividerText}>or</Text>
        
        <Controller
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <TextField
              label="Email or username"
              onChangeText={field.onChange}
              placeholder="you@livegate.com or username"
              value={field.value}
              error={form.formState.errors.identifier?.message}
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
          <Button onPress={() => router.push('/(public)/forgot-password')} title="Forgot password" variant="ghost" />
          <Button onPress={() => router.replace('/(public)/role-selection')} title="Back to mode selection" variant="ghost" />
          <Button onPress={() => router.push('/(public)/sign-up')} title="Need an account? Sign up" variant="ghost" />
        </View>
      </PublicSurface>
      <DemoParticipantsPanel
        onUse={(participant) => {
          setPreferredRoles(participant.roles, participant.defaultRole);
          form.setValue('identifier', participant.email);
          form.setValue('password', participant.password);
        }}
        participants={publicParticipants}
        title="Demo participants"
      />
    </PublicScreen>
  );
}

export function SignUpScreen() {
  const rawPreferredRole = useSessionStore((state) => state.preferredRole);
  const rawPreferredRoles = useSessionStore((state) => state.preferredRoles);
  const preferredRole = normalizePreferredRole(rawPreferredRole);
  const preferredRoles = normalizePreferredRoles(rawPreferredRoles, preferredRole);
  const setSession = useSessionStore((state) => state.setSession);
  const googleConfigured = isGoogleSignInConfigured();
  const googleHelpText = getGoogleSignInHelpText();
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

  React.useEffect(() => {
    initializeGoogleSignIn();
  }, []);

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
        router.replace(getPostAuthRoute(normalized));
      }
    },
  });
  const googleMutation = useMutation({
    mutationFn: async () => {
      const result = await signInWithGoogle();
      return mobileApi.signInWithGoogle({
        idToken: result.idToken,
        role: preferredRole,
        roles: preferredRoles,
      });
    },
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      router.replace(getPostAuthRoute(normalized));
    },
  });

  return (
    <PublicScreen>
      <PublicHeading
        title="Create account"
        eyebrow="Join LiveGate"
        body="Use one account for viewer access, creator tools, or both."
      />
      <PublicSurface>
        <Text style={styles.sectionEyebrow}>Google sign-up</Text>
        <Button
          onPress={() => googleMutation.mutate()}
          title={googleMutation.isPending ? 'Connecting Google...' : 'Create account with Google'}
          variant="secondary"
          disabled={!googleConfigured || googleMutation.isPending}
        />
        <Text style={styles.statusText}>{googleHelpText}</Text>
        {googleMutation.isError ? (
          <Text style={styles.errorText}>{(googleMutation.error as Error).message}</Text>
        ) : null}
        <Text style={styles.dividerText}>or</Text>
        <Text style={styles.sectionEyebrow}>Standard registration</Text>

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
          <Button onPress={() => router.replace('/(public)/role-selection')} title="Back to mode selection" variant="ghost" />
          <Button onPress={() => router.push('/(public)/sign-in')} title="Already have an account? Sign in" variant="ghost" />
        </View>
      </PublicSurface>
    </PublicScreen>
  );
}

export function StaffAccessScreen() {
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const staffParticipants = demoParticipants.filter((participant) => participant.audience === 'staff');

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) => {
      const normalizedIdentifier = values.identifier.trim().toLowerCase();
      const participant = staffParticipants.find(
        (item) => item.email.toLowerCase() === normalizedIdentifier,
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
    <PublicScreen>
      <PublicHeading title="Restricted access" />
      <PublicSurface>
        <Controller
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <TextField
              label="Staff email or username"
              onChangeText={field.onChange}
              placeholder="staff@livegate.com"
              value={field.value}
              error={form.formState.errors.identifier?.message}
            />
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
      </PublicSurface>
      <DemoParticipantsPanel
        onUse={(participant) => {
          setPreferredRoles(participant.roles, participant.defaultRole);
          form.setValue('identifier', participant.email);
          form.setValue('password', participant.password);
        }}
        participants={staffParticipants}
        title="Staff demo accounts"
      />
    </PublicScreen>
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
    <PublicScreen>
      <PublicHeading
        title="Forgot password"
        eyebrow="Recovery"
        body="Enter the email tied to your account and we will send a recovery code."
      />
      <PublicSurface>
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
        {mutation.isSuccess ? <Text style={styles.successText}>{mutation.data?.message}</Text> : null}
        {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Sending...' : 'Send recovery code'} />
        <Button onPress={() => router.push('/(public)/sign-in')} title="Back to sign in" variant="ghost" />
      </PublicSurface>
    </PublicScreen>
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
    <PublicScreen>
      <PublicHeading
        title="Reset password"
        eyebrow="Recovery"
        body="Enter the code you received and choose a new password."
      />
      <PublicSurface>
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
          name="code"
          render={({ field }) => (
            <TextField
              label="Verification code"
              onChangeText={field.onChange}
              placeholder="000000"
              value={field.value}
              error={form.formState.errors.code?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field }) => (
            <TextField
              label="New password"
              onChangeText={field.onChange}
              placeholder="New password"
              secureTextEntry
              value={field.value}
              error={form.formState.errors.password?.message}
            />
          )}
        />
        {mutation.isSuccess ? <Text style={styles.successText}>{mutation.data?.message}</Text> : null}
        {mutation.isError ? <Text style={styles.errorText}>{(mutation.error as Error).message}</Text> : null}
        <Button onPress={form.handleSubmit((values) => mutation.mutate(values))} title={mutation.isPending ? 'Updating password...' : 'Update password'} />
        <Button onPress={() => router.push('/(public)/sign-in')} title="Back to sign in" variant="ghost" />
      </PublicSurface>
    </PublicScreen>
  );
}

export function EmailVerificationScreen() {
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof emailVerificationSchema>>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { email: session?.user.email || '', code: '' },
  });

  const mutation = useMutation({
    mutationFn: mobileApi.confirmEmailVerification,
    onSuccess: (result) => {
      if (!session) {
        router.replace('/(public)/sign-in');
        return;
      }

      const updatedSession = normalizeAuthSession(
        {
          ...session,
          user: {
            ...session.user,
            ...result.user,
          },
          nextStep: result.nextStep ?? null,
        },
        session.user.roles ?? [session.user.role],
        session.user.role,
      );

      setSession(updatedSession);

      if (updatedSession.nextStep === 'complete-profile') {
        router.replace('/(public)/profile-completion');
        return;
      }

      router.replace(
        nextPathForRole(updatedSession.user.role, updatedSession.user.roles),
      );
    },
  });

  return (
    <PublicScreen>
      <PublicHeading title="Verify email" />
      <PublicSurface>
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
      </PublicSurface>
    </PublicScreen>
  );
}

export function ProfileCompletionScreen() {
  const session = useSessionStore((state) => state.session);
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
    onSuccess: (result) => {
      if (!session) {
        router.replace('/(public)/sign-in');
        return;
      }

      const normalized = normalizeAuthSession(
        {
          ...session,
          user: {
            ...session.user,
            ...result.user,
          },
          nextStep: result.nextStep ?? null,
        },
        session.user.roles || [session.user.role],
        session.user.role,
      );
      setSession(normalized);
      if (normalized.user.role === 'creator') {
        router.replace('/(creator)/(tabs)/dashboard');
      } else {
        router.replace('/(viewer)/(tabs)/home');
      }
    },
  });

  return (
    <PublicScreen>
      <PublicHeading title="Complete your profile" />
      <PublicSurface>
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
      </PublicSurface>
    </PublicScreen>
  );
}

const styles = StyleSheet.create({
  publicScreen: {
    backgroundColor: publicPalette.background,
  },
  publicSurface: {
    backgroundColor: publicPalette.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: publicPalette.borderSubtle,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadow.md,
  },
  publicHeadingContainer: {
    gap: theme.spacing.sm,
  },
  publicBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  publicBadgeDefault: {
    backgroundColor: publicPalette.surfaceMuted,
    borderColor: publicPalette.borderSubtle,
  },
  publicBadgePrimary: {
    backgroundColor: publicPalette.surfaceAccent,
    borderColor: publicPalette.surfaceAccent,
  },
  publicBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    letterSpacing: 0.4,
  },
  publicBadgeTextDefault: {
    color: publicPalette.text,
  },
  publicBadgeTextPrimary: {
    color: publicPalette.accent,
  },
  publicEyebrow: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: publicPalette.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  publicTitle: {
    fontSize: theme.typography.sizes['4xl'],
    fontWeight: theme.typography.weights.bold,
    color: publicPalette.text,
    lineHeight: theme.typography.sizes['4xl'] * 1.12,
    fontFamily: theme.typography.displayFontFamily,
  },
  publicBody: {
    fontSize: theme.typography.sizes.base,
    color: publicPalette.textSecondary,
    lineHeight: theme.typography.sizes.base * 1.5,
  },
  publicButton: {
    minHeight: 52,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
  },
  publicButtonPrimary: {
    backgroundColor: publicPalette.accent,
    borderColor: publicPalette.accent,
    ...theme.shadow.md,
  },
  publicButtonSecondary: {
    backgroundColor: publicPalette.surface,
    borderColor: publicPalette.border,
    ...theme.shadow.sm,
  },
  publicButtonGhost: {
    backgroundColor: publicPalette.surfaceAccent,
    borderColor: 'transparent',
  },
  publicButtonDanger: {
    backgroundColor: publicPalette.danger,
    borderColor: publicPalette.danger,
    ...theme.shadow.sm,
  },
  publicButtonDisabled: {
    opacity: 0.55,
  },
  publicButtonText: {
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.2,
    fontSize: theme.typography.sizes.base,
  },
  publicButtonTextPrimary: {
    color: '#ffffff',
  },
  publicButtonTextSecondary: {
    color: publicPalette.text,
  },
  publicButtonTextGhost: {
    color: publicPalette.accent,
  },
  publicTextFieldContainer: {
    gap: theme.spacing.xs,
  },
  publicTextFieldLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: publicPalette.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  publicTextInput: {
    borderWidth: 1,
    borderColor: publicPalette.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.base,
    color: publicPalette.text,
    backgroundColor: publicPalette.surfaceMuted,
    fontFamily: theme.typography.fontFamily,
  },
  publicTextInputError: {
    borderColor: publicPalette.danger,
  },
  splashWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing['4xl'],
  },
  splashTitle: {
    fontSize: theme.typography.sizes['5xl'],
    lineHeight: 54,
    color: publicPalette.text,
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.displayFontFamily,
  },
  splashBody: {
    fontSize: theme.typography.sizes.lg,
    lineHeight: 28,
    color: publicPalette.textSecondary,
    maxWidth: 320,
  },
  roleHero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: publicPalette.border,
    backgroundColor: publicPalette.surface,
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
    backgroundColor: publicPalette.surfaceAccent,
    opacity: 0.9,
  },
  roleHeroBackdropBottom: {
    position: 'absolute',
    bottom: -45,
    left: -20,
    width: 220,
    height: 150,
    borderRadius: theme.radius.pill,
    backgroundColor: publicPalette.infoSoft,
    opacity: 0.72,
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
  roleHeroFeedCompact: {
    flexDirection: 'column',
  },
  roleHeroTile: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: publicPalette.borderSubtle,
    backgroundColor: publicPalette.surfaceMuted,
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
  roleHeroAsideCompact: {
    flexDirection: 'row',
  },
  roleHeroTileSmall: {
    flex: 1,
    minHeight: 58,
  },
  roleHeroTileAccent: {
    backgroundColor: publicPalette.surfaceAccent,
  },
  roleHeroTileKicker: {
    fontSize: theme.typography.sizes.xs,
    color: publicPalette.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: theme.typography.weights.medium,
  },
  roleHeroTileTitle: {
    fontSize: theme.typography.sizes.xl,
    lineHeight: 29,
    color: publicPalette.text,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.displayFontFamily,
    flexShrink: 1,
  },
  roleHeroMetric: {
    fontSize: theme.typography.sizes['2xl'],
    color: publicPalette.text,
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.displayFontFamily,
  },
  roleHeroTileCaption: {
    fontSize: theme.typography.sizes.sm,
    color: publicPalette.textSecondary,
    lineHeight: 20,
    flexShrink: 1,
  },
  roleIntroCard: {
    backgroundColor: publicPalette.surface,
  },
  roleIntroTitle: {
    fontSize: theme.typography.sizes['3xl'],
    lineHeight: 38,
    color: publicPalette.text,
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.displayFontFamily,
  },
  roleIntroBody: {
    fontSize: theme.typography.sizes.base,
    lineHeight: 25,
    color: publicPalette.textSecondary,
  },
  panelTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: publicPalette.text,
    fontFamily: theme.typography.displayFontFamily,
  },
  authDialogIntro: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  authDialogBody: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: publicPalette.textSecondary,
  },
  authDialogActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  authEntryNote: {
    fontSize: theme.typography.sizes.sm,
    color: publicPalette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: -theme.spacing.xs,
  },
  demoCard: {
    backgroundColor: publicPalette.surface,
  },
  demoName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: publicPalette.text,
  },
  demoSummary: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: publicPalette.textSecondary,
  },
  sectionEyebrow: {
    fontSize: theme.typography.sizes.xs,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: publicPalette.accent,
    fontWeight: theme.typography.weights.medium,
  },
  highlightCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: publicPalette.borderSubtle,
    backgroundColor: publicPalette.surfaceMuted,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  highlightTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: publicPalette.text,
  },
  highlightBody: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: publicPalette.textSecondary,
  },
  ruleCard: {
    backgroundColor: publicPalette.surface,
  },
  ruleText: {
    fontSize: theme.typography.sizes.base,
    lineHeight: 24,
    color: publicPalette.text,
    fontWeight: theme.typography.weights.medium,
  },
  modeCardActive: {
    borderColor: publicPalette.accent,
    backgroundColor: publicPalette.surfaceAccent,
  },
  modeTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: publicPalette.text,
    fontFamily: theme.typography.displayFontFamily,
  },
  modeBody: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    color: publicPalette.textSecondary,
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    color: publicPalette.textMuted,
  },
  successText: {
    fontSize: theme.typography.sizes.sm,
    color: publicPalette.success,
    fontWeight: theme.typography.weights.medium,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: publicPalette.danger,
    fontWeight: theme.typography.weights.medium,
  },
  dividerText: {
    fontSize: theme.typography.sizes.sm,
    color: publicPalette.textMuted,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
    fontWeight: theme.typography.weights.medium,
  },
});

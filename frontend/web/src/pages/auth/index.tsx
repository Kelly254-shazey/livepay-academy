import { AuthenticateWithRedirectCallback, useAuth, useSignIn, useSignUp } from '@clerk/clerk-react';
import {
  getRequiredAuthStep,
  normalizeAuthSession,
  type AuthSession,
  type UserRole,
} from '../../lib/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { PageFrame } from '@/components/layout';
import { webApi } from '@/lib/api';
import { Badge, Button, Card, InlineNotice, Input } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';

const publicRoleModes = [
  {
    id: 'viewer',
    title: 'Viewer',
    body: 'Buy lives, unlock content, and access classes.',
    roles: ['viewer'] as UserRole[],
    activeRole: 'viewer' as UserRole,
  },
  {
    id: 'creator',
    title: 'Creator',
    body: 'Publish lives, content, classes, and manage payouts.',
    roles: ['creator'] as UserRole[],
    activeRole: 'creator' as UserRole,
  },
] as const;

const signInSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or username.'),
  password: z.string().min(1, 'Enter your password.').max(256),
});

const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol.');

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name.'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters.')
      .max(32, 'Username must be 32 characters or fewer.'),
    email: z.string().email('Enter a valid email address.'),
    password: passwordSchema,
    confirmPassword: z.string(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
    gender: z.enum(['male', 'female', 'prefer_not_to_say', 'custom']),
    customGender: z.string().trim().max(80).optional(),
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, 'Use a 2-letter country code.'),
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

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
});

const resetSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  code: z.string().trim().length(6, 'Reset codes are 6 digits.'),
  password: passwordSchema,
});

const emailVerificationSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  code: z.string().trim().length(6, 'Verification codes are 6 digits.'),
});

const profileCompletionSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name.'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters.')
      .max(32, 'Username must be 32 characters or fewer.'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
    gender: z.enum(['male', 'female', 'prefer_not_to_say', 'custom']),
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

const selectClassName =
  'w-full rounded-lg border border-stroke bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10';
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ?? '';

function dashboardPathForRole(role: UserRole) {
  if (role === 'creator') return '/dashboard/creator';
  if (role === 'admin' || role === 'moderator') return '/dashboard/admin';
  return '/dashboard/user';
}

function resolveAuthDestination(session: AuthSession) {
  const requiredStep = getRequiredAuthStep(session);

  if (requiredStep === 'verify-email') {
    return '/auth/verify-email';
  }

  if (requiredStep === 'complete-profile') {
    return '/auth/complete-profile';
  }

  return dashboardPathForRole(session.user.role);
}

function mergeAuthStateUpdate(
  session: AuthSession,
  result: { user: AuthSession['user']; nextStep?: AuthSession['nextStep'] },
) {
  return normalizeAuthSession(
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
}

function toAbsoluteUrl(path: string) {
  return new URL(path, window.location.origin).toString();
}

function AuthShell({
  eyebrow,
  title,
  body,
  notes,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  notes: string[];
  children: ReactNode;
}) {
  return (
    <PageFrame>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        <Card className="space-y-5">
          <Badge variant="primary">{eyebrow}</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
            <p className="text-sm leading-6 text-muted">{body}</p>
          </div>
          <div className="space-y-3 border-t border-stroke pt-4">
            {notes.map((note) => (
              <p className="text-sm leading-6 text-muted" key={note}>
                {note}
              </p>
            ))}
          </div>
        </Card>
        <Card>{children}</Card>
      </div>
    </PageFrame>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function ClerkGoogleButton({
  mode,
  role,
}: {
  mode: 'sign-in' | 'sign-up';
  role: 'viewer' | 'creator';
}) {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <InlineNotice
        body="Set VITE_CLERK_PUBLISHABLE_KEY before enabling Google auth."
        title="Google auth unavailable"
      />
    );
  }

  return <ConfiguredClerkGoogleButton mode={mode} role={role} />;
}

function ConfiguredClerkGoogleButton({
  mode,
  role,
}: {
  mode: 'sign-in' | 'sign-up';
  role: 'viewer' | 'creator';
}) {
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const isLoaded = mode === 'sign-in' ? isSignInLoaded : isSignUpLoaded;

  const handleGoogleAuth = async () => {
    const redirectUrl = toAbsoluteUrl('/auth/clerk/callback');
    const redirectUrlComplete = toAbsoluteUrl(`/auth/clerk/exchange?role=${encodeURIComponent(role)}`);

    try {
      setError(null);

      if (mode === 'sign-in') {
        await signIn?.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl,
          redirectUrlComplete,
        });
        return;
      }

      await signUp?.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Google sign-in could not be started.',
      );
    }
  };

  return (
    <div className="space-y-3">
      <Button disabled={!isLoaded} onClick={handleGoogleAuth} type="button" variant="secondary">
        Continue with Google
      </Button>
      {error ? <InlineNotice body={error} title="Google auth unavailable" tone="danger" /> : null}
    </div>
  );
}

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);

  return (
    <AuthShell
      body="Choose the mode you need first. The backend still decides the real role and access that the account is allowed to use."
      eyebrow="Role selection"
      notes={[
        'Viewer mode is for discovery, purchases, and room access.',
        'Creator mode is for publishing, monetization, and payouts.',
      ]}
      title="Start with the right mode"
    >
      <div className="space-y-4">
        {publicRoleModes.map((mode) => {
          const selected =
            preferredRoles.length === mode.roles.length &&
            mode.roles.every((role) => preferredRoles.includes(role));

          return (
            <button
              className={`w-full rounded-lg border p-4 text-left transition ${
                selected ? 'border-text bg-surface-muted' : 'border-stroke bg-surface hover:border-text/40'
              }`}
              key={mode.id}
              onClick={() => setPreferredRoles(mode.roles, mode.activeRole)}
              type="button"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{mode.title}</p>
                  <p className="text-sm text-muted">{mode.body}</p>
                </div>
                {selected ? <Badge variant="primary">Selected</Badge> : null}
              </div>
            </button>
          );
        })}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={() => navigate('/auth/sign-up')}>Continue</Button>
          <Link to="/auth/sign-in">
            <Button variant="secondary">I already have an account</Button>
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export function SignInPage() {
  const navigate = useNavigate();
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const publicPreferredRole: 'viewer' | 'creator' = preferredRole === 'creator' ? 'creator' : 'viewer';
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      webApi.signIn({ ...values, role: publicPreferredRole, roles: preferredRoles }),
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      navigate(resolveAuthDestination(normalized), { replace: true });
    },
  });

  return (
    <AuthShell
      body="Sign in with your email address or username. Session, access, and next-step checks come from the backend."
      eyebrow="Sign in"
      notes={[
        `Selected mode: ${preferredRoles.join(' + ')}`,
        'If the account still needs verification or profile completion, the backend will redirect the flow.',
      ]}
      title="Access your account"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Field error={form.formState.errors.identifier?.message} label="Email or username">
          <Input {...form.register('identifier')} placeholder="you@livegate.com or username" />
        </Field>
        <Field error={form.formState.errors.password?.message} label="Password">
          <Input {...form.register('password')} placeholder="Enter password" type="password" />
        </Field>
        <ClerkGoogleButton mode="sign-in" role={publicPreferredRole} />
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Sign in failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
          <Link to="/auth/forgot-password">
            <Button type="button" variant="ghost">
              Forgot password
            </Button>
          </Link>
          <Link to="/auth/role-selection">
            <Button type="button" variant="secondary">
              Change mode
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function SignUpPage() {
  const navigate = useNavigate();
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const publicPreferredRole: 'viewer' | 'creator' = preferredRole === 'creator' ? 'creator' : 'viewer';
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      customGender: '',
      country: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) =>
      webApi.signUp({ ...values, role: publicPreferredRole }),
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      navigate(resolveAuthDestination(normalized), { replace: true });
    },
  });

  return (
    <AuthShell
      body="Create only the data the backend requires to open an account and continue the real auth flow."
      eyebrow="Create account"
      notes={[
        `Initial mode: ${preferredRoles.join(' + ')}`,
        'The backend still validates the signup payload and decides the next auth step.',
      ]}
      title="Open a LiveGate account"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid gap-5 md:grid-cols-2">
          <Field error={form.formState.errors.fullName?.message} label="Full name">
            <Input {...form.register('fullName')} placeholder="Your full name" />
          </Field>
          <Field error={form.formState.errors.username?.message} label="Username">
            <Input {...form.register('username')} placeholder="yourhandle" />
          </Field>
        </div>
        <Field error={form.formState.errors.email?.message} label="Email">
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field error={form.formState.errors.password?.message} label="Password">
            <Input {...form.register('password')} placeholder="Create password" type="password" />
          </Field>
          <Field error={form.formState.errors.confirmPassword?.message} label="Confirm password">
            <Input {...form.register('confirmPassword')} placeholder="Repeat password" type="password" />
          </Field>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Field error={form.formState.errors.dateOfBirth?.message} label="Date of birth">
            <Input {...form.register('dateOfBirth')} type="date" />
          </Field>
          <Field error={form.formState.errors.gender?.message} label="Gender">
            <select className={selectClassName} {...form.register('gender')}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="custom">Custom</option>
            </select>
          </Field>
          <Field error={form.formState.errors.country?.message} label="Country code">
            <Input
              {...form.register('country', {
                setValueAs: (value) => String(value ?? '').toUpperCase(),
              })}
              maxLength={2}
              placeholder="US"
            />
          </Field>
        </div>
        {form.watch('gender') === 'custom' ? (
          <Field error={form.formState.errors.customGender?.message} label="Custom gender">
            <Input {...form.register('customGender')} placeholder="Enter your gender" />
          </Field>
        ) : null}
        <ClerkGoogleButton mode="sign-up" role={publicPreferredRole} />
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Sign up failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Creating account...' : 'Create account'}
          </Button>
          <Link to="/auth/sign-in">
            <Button type="button" variant="ghost">
              I already have an account
            </Button>
          </Link>
          <Link to="/auth/role-selection">
            <Button type="button" variant="secondary">
              Change mode
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function ClerkGoogleCallbackPage() {
  return (
    <AuthShell
      body="Do not close this page while Clerk finishes the redirect callback."
      eyebrow="Google auth"
      notes={[
        'Clerk handles the Google redirect first.',
        'LiveGate exchanges that identity for the normal backend session on the next step.',
      ]}
      title="Completing Google sign-in"
    >
      <div className="py-8 text-sm text-muted">
        <AuthenticateWithRedirectCallback />
      </div>
    </AuthShell>
  );
}

export function ClerkGoogleExchangePage() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <AuthShell
        body="This deployment does not have Clerk configured."
        eyebrow="Google auth"
        notes={['Set VITE_CLERK_PUBLISHABLE_KEY before enabling Google sign-in.']}
        title="Google sign-in unavailable"
      >
        <InlineNotice body="Clerk publishable key is missing." title="Configuration required" tone="danger" />
      </AuthShell>
    );
  }

  return <ConfiguredClerkGoogleExchangePage />;
}

function ConfiguredClerkGoogleExchangePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const requestedRole = searchParams.get('role') === 'creator' ? 'creator' : 'viewer';

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setError('Google sign-in did not complete. Start again from the LiveGate sign-in page.');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          throw new Error('Clerk session token is unavailable.');
        }

        const session = await webApi.signInWithGoogle({
          clerkToken,
          role: requestedRole,
          roles: [requestedRole],
        });

        const normalized = normalizeAuthSession(session, [requestedRole], requestedRole);
        if (cancelled) return;

        setPreferredRoles([normalized.user.role], normalized.user.role);
        setSession(normalized);
        navigate(resolveAuthDestination(normalized), { replace: true });
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Google sign-in could not be completed.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, navigate, requestedRole, setPreferredRoles, setSession]);

  return (
    <AuthShell
      body="LiveGate is turning the Google identity into the same backend session the rest of the app uses."
      eyebrow="Google auth"
      notes={['The backend still decides whether verification or profile completion is required.']}
      title="Finishing sign-in"
    >
      <div className="space-y-4">
        {error ? (
          <>
            <InlineNotice body={error} title="Google sign-in failed" tone="danger" />
            <Link to="/auth/sign-in">
              <Button type="button" variant="secondary">
                Back to sign in
              </Button>
            </Link>
          </>
        ) : (
          <InlineNotice
            body="Hold on while the backend creates or refreshes your application session."
            title="Completing sign-in"
          />
        )}
      </div>
    </AuthShell>
  );
}

export function StaffAccessPage() {
  const navigate = useNavigate();
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const defaultRole: UserRole = 'moderator';
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      webApi.signIn({ ...values, role: defaultRole, roles: [defaultRole] }),
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, [session.user.role], session.user.role);
      setPreferredRoles([normalized.user.role], normalized.user.role);
      setSession(normalized);
      navigate('/dashboard/admin');
    },
  });

  return (
    <AuthShell
      body="Moderators and admins enter through a separate route from the public product."
      eyebrow="Staff portal"
      notes={[
        'Use staff credentials provisioned by the backend administration flow.',
        'Actual permissions still come from the authenticated account.',
      ]}
      title="Restricted access"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Field error={form.formState.errors.identifier?.message} label="Staff email or username">
          <Input {...form.register('identifier')} placeholder="staff@livegate.com" />
        </Field>
        <Field error={form.formState.errors.password?.message} label="Password">
          <Input {...form.register('password')} placeholder="Enter password" type="password" />
        </Field>
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Staff sign in failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Opening portal...' : 'Enter staff portal'}
          </Button>
          <Link to="/auth/sign-in">
            <Button type="button" variant="ghost">
              Back to public sign in
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });
  const mutation = useMutation({
    mutationFn: webApi.forgotPassword,
  });

  return (
    <AuthShell
      body="Request a reset code for an existing account."
      eyebrow="Recovery"
      notes={['The backend handles token generation and delivery.']}
      title="Password recovery"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Field error={form.formState.errors.email?.message} label="Account email">
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </Field>
        {mutation.isSuccess ? <InlineNotice body={mutation.data.message} title="Recovery request sent" /> : null}
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Request failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Sending...' : 'Send reset code'}
          </Button>
          <Link to="/auth/reset-password">
            <Button type="button" variant="secondary">
              I have a code
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', code: '', password: '' },
  });
  const mutation = useMutation({
    mutationFn: webApi.resetPassword,
  });

  return (
    <AuthShell
      body="Confirm the reset code issued by the backend and set a new password."
      eyebrow="Reset password"
      notes={['The code and new password are validated server-side.']}
      title="Set a new password"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Field error={form.formState.errors.email?.message} label="Email">
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </Field>
        <Field error={form.formState.errors.code?.message} label="Reset code">
          <Input {...form.register('code')} placeholder="000000" />
        </Field>
        <Field error={form.formState.errors.password?.message} label="New password">
          <Input {...form.register('password')} placeholder="Create new password" type="password" />
        </Field>
        {mutation.isSuccess ? <InlineNotice body={mutation.data.message} title="Password updated" /> : null}
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Reset failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Updating...' : 'Update password'}
          </Button>
          <Link to="/auth/sign-in">
            <Button type="button" variant="ghost">
              Back to sign in
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof emailVerificationSchema>>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email: session?.user.email ?? '',
      code: '',
    },
  });
  const requestMutation = useMutation({
    mutationFn: webApi.requestEmailVerification,
  });
  const confirmMutation = useMutation({
    mutationFn: webApi.confirmEmailVerification,
    onSuccess: (result) => {
      if (!session) {
        navigate('/auth/sign-in', { replace: true });
        return;
      }

      const updatedSession = mergeAuthStateUpdate(session, result);
      setSession(updatedSession);
      navigate(resolveAuthDestination(updatedSession), { replace: true });
    },
  });

  return (
    <AuthShell
      body="Use the six-digit code issued by the backend to continue the session."
      eyebrow="Verify email"
      notes={['If this page was opened on another device, verify first and then sign in again.']}
      title="Confirm your email"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => confirmMutation.mutate(values))}>
        <Field error={form.formState.errors.email?.message} label="Email">
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </Field>
        <Field error={form.formState.errors.code?.message} label="Verification code">
          <Input {...form.register('code')} placeholder="000000" />
        </Field>
        {confirmMutation.isSuccess ? <InlineNotice body={confirmMutation.data.message} title="Email verified" /> : null}
        {confirmMutation.isError ? (
          <InlineNotice body={(confirmMutation.error as Error).message} title="Verification failed" tone="danger" />
        ) : null}
        {requestMutation.isSuccess ? (
          <InlineNotice body={requestMutation.data.message} title="Verification code sent" />
        ) : null}
        {requestMutation.isError ? (
          <InlineNotice body={(requestMutation.error as Error).message} title="Resend failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={confirmMutation.isPending} type="submit">
            {confirmMutation.isPending ? 'Verifying...' : 'Verify email'}
          </Button>
          <Button
            disabled={!session || requestMutation.isPending}
            onClick={() => requestMutation.mutate()}
            type="button"
            variant="secondary"
          >
            {requestMutation.isPending ? 'Sending...' : 'Resend code'}
          </Button>
          <Link to="/auth/sign-in">
            <Button type="button" variant="ghost">
              Back to sign in
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof profileCompletionSchema>>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      fullName: session?.user.fullName ?? '',
      username: session?.user.username ?? '',
      dateOfBirth: session?.user.dateOfBirth ?? '',
      gender: session?.user.gender ?? 'prefer_not_to_say',
      customGender: session?.user.customGender ?? '',
    },
  });
  const mutation = useMutation({
    mutationFn: webApi.completeProfile,
    onSuccess: (result) => {
      if (!session) {
        navigate('/auth/sign-in', { replace: true });
        return;
      }

      const updatedSession = mergeAuthStateUpdate(session, result);
      setSession(updatedSession);
      navigate(resolveAuthDestination(updatedSession), { replace: true });
    },
  });

  return (
    <AuthShell
      body="Finish the remaining backend-required profile fields."
      eyebrow="Complete profile"
      notes={['These details are stored server-side and used by the real access and moderation flow.']}
      title="Finish setup"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Field error={form.formState.errors.fullName?.message} label="Full name">
          <Input {...form.register('fullName')} placeholder="Your full name" />
        </Field>
        <Field error={form.formState.errors.username?.message} label="Username">
          <Input {...form.register('username')} placeholder="yourhandle" />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field error={form.formState.errors.dateOfBirth?.message} label="Date of birth">
            <Input {...form.register('dateOfBirth')} type="date" />
          </Field>
          <Field error={form.formState.errors.gender?.message} label="Gender">
            <select className={selectClassName} {...form.register('gender')}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="custom">Custom</option>
            </select>
          </Field>
        </div>
        {form.watch('gender') === 'custom' ? (
          <Field error={form.formState.errors.customGender?.message} label="Custom gender">
            <Input {...form.register('customGender')} placeholder="Enter your gender" />
          </Field>
        ) : null}
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Profile completion failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={!session || mutation.isPending} type="submit">
            {mutation.isPending ? 'Saving...' : 'Complete profile'}
          </Button>
          <Link to="/auth/sign-in">
            <Button type="button" variant="ghost">
              Back to sign in
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

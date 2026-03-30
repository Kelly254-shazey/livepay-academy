import { AuthenticateWithRedirectCallback, useAuth, useSignIn, useSignUp } from '@clerk/clerk-react';
import {
  getRequiredAuthStep,
  normalizeAuthSession,
  type AuthSession,
  type UserRole,
} from '../../lib/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { type ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { webApi } from '@/lib/api';
import { PageFrame } from '@/components/layout';
import { Badge, Button, Card, InlineNotice, Input } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';

const publicRoleModes = [
  {
    id: 'viewer',
    title: 'Viewer',
    body: 'Discover creators, pay for access, join live sessions, and build a premium learning library.',
    roles: ['viewer'] as UserRole[],
    activeRole: 'viewer' as UserRole,
  },
  {
    id: 'creator',
    title: 'Creator',
    body: 'Host paid lives, publish premium content, run classes, and manage payouts.',
    roles: ['creator'] as UserRole[],
    activeRole: 'creator' as UserRole,
  },
] as const;

function AuthShell({
  eyebrow,
  title,
  body,
  sidebar,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <PageFrame>
      <div className="mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <Card className="flex flex-col justify-between gap-8">
          <div className="space-y-4">
            <Badge tone="accent">{eyebrow}</Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
              <p className="max-w-lg text-sm leading-7 text-muted">{body}</p>
            </div>
          </div>
          <div className="space-y-4">{sidebar}</div>
        </Card>
        <Card className="flex items-center">{children}</Card>
      </div>
    </PageFrame>
  );
}

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

function mergeAuthStateUpdate(session: AuthSession, result: { user: AuthSession['user']; nextStep?: AuthSession['nextStep'] }) {
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

const signInSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(1).max(256),
});

const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol.');

const signUpSchema = z.object({
  fullName: z.string().min(2),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(32, 'Username must be 32 characters or fewer.'),
  email: z.string().email(),
  password: passwordSchema,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  gender: z.enum(['male', 'female', 'prefer_not_to_say', 'custom']),
  customGender: z.string().trim().max(80).optional(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
  password: passwordSchema,
});

const emailVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
});

const profileCompletionSchema = z.object({
  fullName: z.string().min(2),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(32, 'Username must be 32 characters or fewer.'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  gender: z.enum(['male', 'female', 'prefer_not_to_say', 'custom']),
  customGender: z.string().trim().max(80).optional(),
}).superRefine((values, ctx) => {
  if (values.gender === 'custom' && !values.customGender?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['customGender'],
      message: 'Tell us how you identify.',
    });
  }
});

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ?? '';

function toAbsoluteUrl(path: string) {
  return new URL(path, window.location.origin).toString();
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
        body="Set VITE_CLERK_PUBLISHABLE_KEY before enabling Clerk Google auth."
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

  const handleGoogleSignIn = async () => {
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
        caughtError instanceof Error
          ? caughtError.message
          : 'Google sign-in could not be started.',
      );
    }
  };

  return (
    <div className="space-y-3">
      <Button
        disabled={!isLoaded}
        onClick={handleGoogleSignIn}
        type="button"
        variant="secondary"
      >
        Continue with Google
      </Button>
      {error ? (
        <InlineNotice body={error} title="Google auth unavailable" tone="danger" />
      ) : null}
    </div>
  );
}

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);

  return (
    <AuthShell
      eyebrow="Public access"
      title="Choose your LiveGate mode"
      body="Public entry is intentionally simple: viewer or creator. Staff access uses a separate portal and is not promoted in public onboarding."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>Viewer accounts focus on discovery, purchases, and live access.</p>
          <p>Creator accounts manage publishing, monetization, and payouts.</p>
        </div>
      }
    >
      <div className="w-full space-y-6">
        <div className="space-y-3">
          {publicRoleModes.map((mode) => {
            const selected =
              preferredRoles.length === mode.roles.length &&
              mode.roles.every((role) => preferredRoles.includes(role));

            return (
              <button
                key={mode.id}
                className={`w-full rounded-[26px] border p-5 text-left transition ${
                  selected
                    ? 'border-white/55 bg-white/32'
                    : 'border-white/30 bg-white/16 hover:border-white/45 hover:bg-white/24'
                }`}
                onClick={() => setPreferredRoles(mode.roles, mode.activeRole)}
                type="button"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{mode.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{mode.body}</p>
                  </div>
                  {selected ? <Badge tone="accent">Selected</Badge> : null}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
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
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
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
      eyebrow="Sign in"
      title="Sign in to LiveGate"
      body="Use a public viewer or creator account here. Backend authentication, access checks, and session state are enforced server-side."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>Use your email address or username to authenticate.</p>
          <p>Role context is derived from the account returned by the backend.</p>
        </div>
      }
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Email or username</label>
          <Input {...form.register('identifier')} placeholder="you@livegate.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input {...form.register('password')} placeholder="Enter password" type="password" />
        </div>
        <InlineNotice
          body={`Selected access mode: ${preferredRoles.join(' + ')}.`}
          title="Account context"
        />
        <ClerkGoogleButton mode="sign-in" role={publicPreferredRole} />
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Sign in failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
          <Link to="/auth/forgot-password">
            <Button variant="ghost" type="button">
              Forgot password
            </Button>
          </Link>
          <Link to="/auth/role-selection">
            <Button variant="secondary" type="button">
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
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      customGender: '',
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
      eyebrow="Create account"
      title="Open your LiveGate account"
      body="Open a viewer account for purchases and access, or a creator account for publishing and monetization."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>Current mode: {preferredRoles.join(' + ')}.</p>
          <p>Registration data is validated against the backend schema before the account is created.</p>
        </div>
      }
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Full name</label>
          <Input {...form.register('fullName')} placeholder="Your full name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input {...form.register('username')} placeholder="yourhandle" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input {...form.register('password')} placeholder="Create password" type="password" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date of birth</label>
            <Input {...form.register('dateOfBirth')} type="date" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <select
              className="w-full rounded-[22px] border border-white/40 bg-white/28 px-4 py-3.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none backdrop-blur-xl transition focus:border-white/60 focus:bg-white/40"
              {...form.register('gender')}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        {form.watch('gender') === 'custom' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom gender</label>
            <Input {...form.register('customGender')} placeholder="Enter your gender" />
          </div>
        ) : null}
        <InlineNotice
          body={`This account will open with ${preferredRoles.join(' + ')} permissions.`}
          title="Role assignment"
        />
        <ClerkGoogleButton mode="sign-up" role={publicPreferredRole} />
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Sign up failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Creating account...' : 'Create account'}
          </Button>
          <Link to="/auth/sign-in">
            <Button variant="ghost" type="button">
              I already have an account
            </Button>
          </Link>
          <Link to="/auth/role-selection">
            <Button variant="secondary" type="button">
              Change mode
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function ClerkGoogleCallbackPage() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <AuthShell
        eyebrow="Google auth"
        title="Google sign-in unavailable"
        body="Clerk is not configured for this deployment yet."
        sidebar={<p className="text-sm leading-6 text-muted">Set VITE_CLERK_PUBLISHABLE_KEY in the deployed frontend environment before using Google sign-in.</p>}
      >
        <InlineNotice
          body="Clerk publishable key is missing."
          title="Configuration required"
          tone="danger"
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Google auth"
      title="Completing Google sign-in"
      body="Clerk is finalizing your Google session before LiveGate exchanges it for the backend session and database-backed user state."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>Do not close this page while the Google callback is being processed.</p>
          <p>Once Clerk finishes, LiveGate will issue the standard application session and continue the normal auth flow.</p>
        </div>
      }
    >
      <div className="w-full py-8 text-sm text-muted">
        <AuthenticateWithRedirectCallback />
      </div>
    </AuthShell>
  );
}

export function ClerkGoogleExchangePage() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <AuthShell
        eyebrow="Google auth"
        title="Google sign-in unavailable"
        body="Clerk is not configured for this deployment yet."
        sidebar={<p className="text-sm leading-6 text-muted">Set VITE_CLERK_PUBLISHABLE_KEY in the deployed frontend environment before using Google sign-in.</p>}
      >
        <InlineNotice
          body="Clerk publishable key is missing."
          title="Configuration required"
          tone="danger"
        />
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

        if (cancelled) {
          return;
        }

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
      eyebrow="Google auth"
      title="Finishing LiveGate sign-in"
      body="Your Google identity is being exchanged for the normal LiveGate session so the backend can keep audit, access, and profile state in one place."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>Google authentication is brokered by Clerk, then resolved by the LiveGate backend.</p>
          <p>The final destination still depends on backend state such as email verification and profile completion.</p>
        </div>
      }
    >
      <div className="w-full space-y-4">
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
            body="Hold on while LiveGate creates or refreshes your backend session."
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
  const [defaultRole] = ['moderator'];
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      webApi.signIn({ ...values, role: defaultRole as UserRole, roles: [defaultRole as UserRole] }),
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, [session.user.role], session.user.role);
      setPreferredRoles([normalized.user.role], normalized.user.role);
      setSession(normalized);
      navigate('/dashboard/admin');
    },
  });

  return (
    <AuthShell
      eyebrow="Restricted staff portal"
      title="Staff access only"
      body="This route is intentionally separate from public onboarding. Moderators and admins enter through a staff-specific access surface."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>Use provisioned staff credentials issued by the backend administration flow.</p>
          <p>Admin and moderator permissions are resolved from the authenticated account, not from local UI state.</p>
        </div>
      }
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Staff email or username</label>
          <Input {...form.register('identifier')} placeholder="staff@livegate.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input {...form.register('password')} placeholder="Enter password" type="password" />
        </div>
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Staff sign in failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Opening portal...' : 'Enter staff portal'}
          </Button>
          <Link to="/auth/sign-in">
            <Button variant="ghost" type="button">
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
      eyebrow="Recovery"
      title="Password recovery"
      body="Password recovery is handled by the backend and email delivery pipeline."
      sidebar={<p className="text-sm leading-6 text-muted">Request a reset code for an existing account, then complete the confirmation step once the backend delivers it.</p>}
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Account email</label>
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </div>
        {mutation.isSuccess ? (
          <InlineNotice body={mutation.data.message} title="Recovery request sent" />
        ) : null}
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Request failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Sending...' : 'Send reset link'}
          </Button>
          <Link to="/auth/reset-password">
            <Button variant="secondary" type="button">
              I have a token
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
      eyebrow="Reset"
      title="Reset your password"
      body="Complete the reset flow with the code issued by the backend."
      sidebar={<p className="text-sm leading-6 text-muted">The reset request is validated server-side before the password is changed.</p>}
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reset code</label>
          <Input {...form.register('code')} placeholder="Paste code" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">New password</label>
          <Input {...form.register('password')} placeholder="Create new password" type="password" />
        </div>
        {mutation.isSuccess ? (
          <InlineNotice body={mutation.data.message} title="Password updated" />
        ) : null}
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Reset failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Updating...' : 'Update password'}
          </Button>
          <Link to="/auth/sign-in">
            <Button variant="ghost" type="button">
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
      eyebrow="Verification"
      title="Verify your email"
      body="Use the 6-digit code issued by the backend. If you registered from this browser, verification continues the current session."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>Email verification is enforced by the backend before access is fully opened.</p>
          <p>If you opened this page from a different device, verify first and then sign in again.</p>
        </div>
      }
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => confirmMutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Verification code</label>
          <Input {...form.register('code')} placeholder="000000" />
        </div>
        {confirmMutation.isSuccess ? (
          <InlineNotice body={confirmMutation.data.message} title="Email verified" />
        ) : null}
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
            <Button variant="ghost" type="button">
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
      eyebrow="Profile"
      title="Complete your profile"
      body="Finish the backend-required profile fields so access state, creator setup, and audit records stay consistent."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>These details are stored server-side and used by the real access and moderation flow.</p>
          <p>If your session has expired, sign in again before completing your profile.</p>
        </div>
      }
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Full name</label>
          <Input {...form.register('fullName')} placeholder="Your full name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input {...form.register('username')} placeholder="yourhandle" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date of birth</label>
            <Input {...form.register('dateOfBirth')} type="date" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <select
              className="w-full rounded-[22px] border border-white/40 bg-white/28 px-4 py-3.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none backdrop-blur-xl transition focus:border-white/60 focus:bg-white/40"
              {...form.register('gender')}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        {form.watch('gender') === 'custom' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom gender</label>
            <Input {...form.register('customGender')} placeholder="Enter your gender" />
          </div>
        ) : null}
        {mutation.isError ? (
          <InlineNotice body={(mutation.error as Error).message} title="Profile completion failed" tone="danger" />
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={!session || mutation.isPending} type="submit">
            {mutation.isPending ? 'Saving...' : 'Complete profile'}
          </Button>
          <Link to="/auth/sign-in">
            <Button variant="ghost" type="button">
              Back to sign in
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

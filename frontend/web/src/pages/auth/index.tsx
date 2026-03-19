import type { UserRole } from '@livegate/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { webApi } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';
import { Badge, Button, Card, InlineNotice, Input } from '@/components/ui';
import { PageFrame } from '@/components/layout';

function AuthShell({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <PageFrame>
      <div className="mx-auto grid min-h-[calc(100vh-180px)] max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="flex flex-col justify-between gap-6 bg-gradient-to-br from-surface via-surface to-accent-muted">
          <div className="space-y-4">
            <Badge tone="accent">Authentication</Badge>
            <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="max-w-lg text-sm leading-7 text-muted">{body}</p>
          </div>
          <div className="space-y-2 text-sm text-muted">
            <p>Role-aware auth is wired for viewers, creators, moderators, and admins.</p>
            <p>Forms are production-style and API-backed with no seeded credentials.</p>
          </div>
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

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const preferredRole = useSessionStore((state) => state.preferredRole);
  const setPreferredRole = useSessionStore((state) => state.setPreferredRole);

  const options: Array<{ role: UserRole; title: string; body: string }> = [
    {
      role: 'viewer',
      title: 'Viewer',
      body: 'Browse categories, pay to join lives, unlock premium content, and enroll in classes.',
    },
    {
      role: 'creator',
      title: 'Creator',
      body: 'Run paid live sessions, publish premium content, manage classes, and request payouts.',
    },
    {
      role: 'moderator',
      title: 'Moderator',
      body: 'Review platform health, watch community risk, and assist operational oversight.',
    },
    {
      role: 'admin',
      title: 'Admin',
      body: 'Monitor revenue, commissions, approvals, flagged content, and platform-wide system metrics.',
    },
  ];

  return (
    <AuthShell
      title="Choose your LiveGate role"
      body="Role selection happens before auth so the experience, guardrails, and dashboard entry point are all intentional from the start."
    >
      <div className="w-full space-y-6">
        <div className="space-y-3">
          {options.map((option) => (
            <button
              className={`w-full rounded-[26px] border p-5 text-left transition ${
                preferredRole === option.role
                  ? 'border-text bg-surface-muted'
                  : 'border-stroke hover:border-text/40'
              }`}
              key={option.role}
              onClick={() => setPreferredRole(option.role)}
              type="button"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{option.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{option.body}</p>
                </div>
                {preferredRole === option.role ? <Badge tone="accent">Selected</Badge> : null}
              </div>
            </button>
          ))}
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
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) =>
      webApi.signIn({ ...values, role: preferredRole }),
    onSuccess: (session) => {
      setSession(session);
      navigate(dashboardPathForRole(session.user.role));
    },
  });

  return (
    <AuthShell
      title="Sign in with confidence"
      body="The sign-in flow is wired for real API sessions, persistent auth state, and role-based routing immediately after authentication."
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input {...form.register('email')} placeholder="you@livegate.com" />
          {form.formState.errors.email ? (
            <p className="text-sm text-danger">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input {...form.register('password')} placeholder="Enter password" type="password" />
          {form.formState.errors.password ? (
            <p className="text-sm text-danger">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <InlineNotice
          body={`Current role context: ${preferredRole}. Change it if you want a different dashboard entry point.`}
          title="Role-aware authentication"
        />
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
              Change role
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
  const setSession = useSessionStore((state) => state.setSession);
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) =>
      webApi.signUp({ ...values, role: preferredRole }),
    onSuccess: (session) => {
      setSession(session);
      navigate(dashboardPathForRole(session.user.role));
    },
  });

  return (
    <AuthShell
      title="Create your LiveGate account"
      body="Start with a precise role context and move into the right dashboard with a clean, API-backed onboarding flow."
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Full name</label>
          <Input {...form.register('fullName')} placeholder="Your full name" />
          {form.formState.errors.fullName ? (
            <p className="text-sm text-danger">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input {...form.register('email')} placeholder="you@livegate.com" />
          {form.formState.errors.email ? (
            <p className="text-sm text-danger">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input {...form.register('password')} placeholder="Create password" type="password" />
          {form.formState.errors.password ? (
            <p className="text-sm text-danger">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <InlineNotice
          body={`Account will be created under the ${preferredRole} role context.`}
          title="Selected role"
        />
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
              Change role
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
      title="Password recovery"
      body="The recovery flow is ready for a real email delivery backend, token verification, and reset completion states."
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
              I have a reset token
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
    defaultValues: { email: '', token: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: webApi.resetPassword,
  });

  return (
    <AuthShell
      title="Reset your password"
      body="This screen is production-wired for real password resets, verification tokens, and secure completion handling."
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
          <label className="text-sm font-medium">Reset token</label>
          <Input {...form.register('token')} placeholder="Paste token" />
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

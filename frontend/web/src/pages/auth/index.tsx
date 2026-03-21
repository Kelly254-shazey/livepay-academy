import {
  demoParticipants,
  normalizeAuthSession,
  type DemoParticipant,
  type UserRole,
} from '@livegate/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { type ReactNode, useEffect } from 'react';
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
  {
    id: 'hybrid',
    title: 'Viewer + Creator',
    body: 'Operate both sides from one account and switch role context without signing out.',
    roles: ['viewer', 'creator'] as UserRole[],
    activeRole: 'viewer' as UserRole,
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

function DemoAccountPanel({
  title,
  body,
  participants,
  onUse,
}: {
  title: string;
  body: string;
  participants: DemoParticipant[];
  onUse: (participant: DemoParticipant) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm leading-6 text-muted">{body}</p>
      </div>
      <div className="grid gap-3">
        {participants.map((participant) => (
          <button
            key={participant.id}
            className="rounded-[24px] border border-white/35 bg-white/22 p-4 text-left transition hover:border-white/50 hover:bg-white/32"
            onClick={() => onUse(participant)}
            type="button"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold">{participant.fullName}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">{participant.roleLabel}</p>
              </div>
              <Badge tone={participant.audience === 'staff' ? 'warning' : 'accent'}>
                Demo
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{participant.summary}</p>
            <p className="mt-3 text-xs text-muted">{participant.email}</p>
          </button>
        ))}
      </div>
    </div>
  );
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
  const preferredRoles = useSessionStore((state) => state.preferredRoles);
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);

  return (
    <AuthShell
      eyebrow="Public access"
      title="Choose your LiveGate mode"
      body="Public entry is intentionally simple: audience, creator, or both. Staff access uses a separate portal and is not promoted in public onboarding."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>One identity can hold both viewer and creator permissions.</p>
          <p>Admins and moderators sign in through a separate restricted staff portal.</p>
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
  const [searchParams] = useSearchParams();
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
      webApi.signIn({ ...values, role: preferredRole, roles: preferredRoles }),
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      navigate(dashboardPathForRole(normalized.user.role));
    },
  });

  const publicParticipants = demoParticipants.filter((participant) => participant.audience === 'public');

  useEffect(() => {
    const demoId = searchParams.get('demo');
    if (!demoId) return;

    const participant = publicParticipants.find((item) => item.id === demoId);
    if (!participant) return;

    setPreferredRoles(participant.roles, participant.defaultRole);
    form.setValue('email', participant.email);
    form.setValue('password', participant.password);
  }, [form, publicParticipants, searchParams, setPreferredRoles]);

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Sign in to LiveGate"
      body="Use a public viewer or creator mode here. Hybrid accounts keep both viewer and creator permissions under one login."
      sidebar={
        <DemoAccountPanel
          body="Use any of these demo participants with the shared password to preview dashboards and navigation flows."
          onUse={(participant) => {
            setPreferredRoles(participant.roles, participant.defaultRole);
            form.setValue('email', participant.email);
            form.setValue('password', participant.password);
          }}
          participants={publicParticipants}
          title="Demo participants"
        />
      }
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
          <label className="text-sm font-medium">Password</label>
          <Input {...form.register('password')} placeholder="Enter password" type="password" />
        </div>
        <InlineNotice
          body={`Selected access mode: ${preferredRoles.join(' + ')}.`}
          title="Account context"
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
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signUpSchema>) =>
      webApi.signUp({ ...values, role: preferredRole, roles: preferredRoles }),
    onSuccess: (session) => {
      const normalized = normalizeAuthSession(session, preferredRoles, preferredRole);
      setSession(normalized);
      navigate(dashboardPathForRole(normalized.user.role));
    },
  });

  return (
    <AuthShell
      eyebrow="Create account"
      title="Open your LiveGate account"
      body="You can open a viewer account, a creator account, or a hybrid account that can switch between both roles after sign-in."
      sidebar={
        <div className="space-y-3 text-sm text-muted">
          <p>Current mode: {preferredRoles.join(' + ')}.</p>
          <p>Use separate emails if you want strict account separation between viewer and creator identities.</p>
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
          <label className="text-sm font-medium">Email</label>
          <Input {...form.register('email')} placeholder="you@livegate.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input {...form.register('password')} placeholder="Create password" type="password" />
        </div>
        <InlineNotice
          body={`This account will open with ${preferredRoles.join(' + ')} permissions.`}
          title="Role assignment"
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
              Change mode
            </Button>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

export function StaffAccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setPreferredRoles = useSessionStore((state) => state.setPreferredRoles);
  const setSession = useSessionStore((state) => state.setSession);
  const [defaultRole] = ['moderator'];
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const staffParticipants = demoParticipants.filter((participant) => participant.audience === 'staff');

  useEffect(() => {
    const demoId = searchParams.get('demo');
    if (!demoId) return;

    const participant = staffParticipants.find((item) => item.id === demoId);
    if (!participant) return;

    setPreferredRoles(participant.roles, participant.defaultRole);
    form.setValue('email', participant.email);
    form.setValue('password', participant.password);
  }, [form, searchParams, setPreferredRoles, staffParticipants]);

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof signInSchema>) => {
      const participant = staffParticipants.find(
        (item) => item.email.toLowerCase() === values.email.toLowerCase(),
      );
      const role = participant?.defaultRole ?? (defaultRole as UserRole);
      return webApi.signIn({ ...values, role, roles: [role] });
    },
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
        <DemoAccountPanel
          body="These staff demo identities take you directly into the oversight dashboard."
          onUse={(participant) => {
            setPreferredRoles(participant.roles, participant.defaultRole);
            form.setValue('email', participant.email);
            form.setValue('password', participant.password);
          }}
          participants={staffParticipants}
          title="Staff demo access"
        />
      }
    >
      <form
        className="w-full space-y-5"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Staff email</label>
          <Input {...form.register('email')} placeholder="staff@livegate.com" />
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
      body="Reset flows remain available for both real API sessions and demo preview mode."
      sidebar={<p className="text-sm leading-6 text-muted">If the backend is offline, demo mode will still let you explore the rest of the product.</p>}
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
    defaultValues: { email: '', token: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: webApi.resetPassword,
  });

  return (
    <AuthShell
      eyebrow="Reset"
      title="Reset your password"
      body="Complete the reset flow with a token from email or use demo mode to continue exploring the product."
      sidebar={<p className="text-sm leading-6 text-muted">Demo reset flows accept any token and return a preview-safe success response.</p>}
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

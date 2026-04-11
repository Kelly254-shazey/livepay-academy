import { brand, categories, getSessionRoles, type UserRole } from '../../lib/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { webApi } from '@/lib/api';
import { Badge, Button, Card, cx } from '@/components/ui';
import { useSessionStore } from '@/store/session-store';

function dashboardPathForRole(role: UserRole) {
  if (role === 'creator') return '/dashboard/creator';
  if (role === 'admin' || role === 'moderator') return '/dashboard/admin';
  return '/dashboard/user';
}

function roleLabel(role: UserRole) {
  if (role === 'admin') return 'Admin';
  if (role === 'moderator') return 'Moderator';
  if (role === 'creator') return 'Creator';
  return 'Viewer';
}

export function Navbar() {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const setActiveRole = useSessionStore((state) => state.setActiveRole);
  const signOut = useSessionStore((state) => state.signOut);
  const sessionRoles = getSessionRoles(session);
  const notificationsQuery = useQuery({
    queryKey: ['notifications-nav', session?.user.id],
    queryFn: webApi.getNotifications,
    enabled: Boolean(session),
  });
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = session?.tokens.refreshToken;
      if (!refreshToken) {
        return { message: 'Signed out' };
      }

      return webApi.logout({ refreshToken });
    },
    onSettled: () => {
      signOut();
      navigate('/auth/sign-in');
    },
  });
  const unreadCount = notificationsQuery.data?.items.filter((item) => !item.read).length ?? 0;

  return (
    <header className="border-b border-stroke bg-canvas">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link className="min-w-0" to="/">
            <p className="text-lg font-semibold tracking-[-0.03em]">{brand.name}</p>
            <p className="text-sm text-muted">{brand.tagline}</p>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <label className="hidden text-sm text-muted sm:block" htmlFor="global-category">
              Browse
            </label>
            <select
              className="rounded-lg border border-stroke bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
              defaultValue=""
              id="global-category"
              onChange={(event) => {
                const slug = event.target.value;
                if (!slug) return;
                navigate(`/categories/${slug}`);
                event.currentTarget.value = '';
              }}
            >
              <option value="">Choose category</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.title}
                </option>
              ))}
            </select>

            {session ? (
              <>
                <Link to="/notifications">
                  <Button size="sm" variant="secondary">
                    Notifications {unreadCount ? `(${unreadCount})` : ''}
                  </Button>
                </Link>
                <Link to={dashboardPathForRole(session.user.role)}>
                  <Button size="sm">Dashboard</Button>
                </Link>
                <Button
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  size="sm"
                  variant="ghost"
                >
                  {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth/role-selection">
                  <Button size="sm" variant="secondary">
                    Choose role
                  </Button>
                </Link>
                <Link to="/auth/sign-in">
                  <Button size="sm">Sign in</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {session ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-stroke pt-3">
            <p className="mr-2 text-sm text-muted">
              {session.user.fullName}
            </p>
            {sessionRoles.map((role) => (
              <button
                key={role}
                className={cx(
                  'rounded-full border px-3 py-1 text-xs font-medium transition',
                  session.user.role === role
                    ? 'border-text bg-text text-canvas'
                    : 'border-stroke bg-surface text-muted hover:border-text hover:text-text',
                )}
                onClick={() => {
                  setActiveRole(role);
                  navigate(dashboardPathForRole(role));
                }}
                type="button"
              >
                {roleLabel(role)}
              </button>
            ))}
            <Badge variant={session.user.role === 'creator' ? 'primary' : session.user.role === 'viewer' ? 'default' : 'warning'}>
              Active: {roleLabel(session.user.role)}
            </Badge>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-stroke bg-canvas">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>{brand.description}</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/auth/sign-in">Sign in</Link>
          <Link to="/auth/role-selection">Choose role</Link>
          <Link to="/staff/portal">Staff portal</Link>
        </div>
      </div>
    </footer>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-text">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function Sidebar({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <Card className="space-y-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <NavLink
            key={item.href}
            className={({ isActive }) =>
              cx(
                'rounded-full border px-3 py-1.5 text-sm transition',
                isActive
                  ? 'border-text bg-text text-canvas'
                  : 'border-stroke bg-surface text-muted hover:border-text hover:text-text',
              )
            }
            to={item.href}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </Card>
  );
}

export function AppShell({
  sidebarTitle,
  sidebarItems,
  children,
}: {
  sidebarTitle: string;
  sidebarItems: Array<{ label: string; href: string }>;
  children: ReactNode;
}) {
  return (
    <PageFrame>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {sidebarItems.length ? (
          <div className="mb-8">
            <Sidebar items={sidebarItems} title={sidebarTitle} />
          </div>
        ) : null}
        <div className="space-y-8">{children}</div>
      </div>
    </PageFrame>
  );
}

export function HeroPanel({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted">{body}</p>
        {action}
      </div>
      <div className="space-y-3 border-t border-stroke pt-4 text-sm text-muted lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <p>Backend owns access checks, checkout state, payouts, and role-based session rules.</p>
        <p>The web surface stays intentionally small so users reach sign in, discovery, and dashboards faster.</p>
      </div>
    </Card>
  );
}

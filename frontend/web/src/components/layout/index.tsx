import { brand, categories, getSessionRoles } from '@livegate/shared';
import type { UserRole } from '@livegate/shared';
import { type ReactNode, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AssistantDock } from './AssistantDock';
import { webApi } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';
import { Badge, Button, Card, cx } from '@/components/ui';

const footerLinks = [
  { label: 'Explore', href: '/categories/education' },
  { label: 'Become a creator', href: '/auth/role-selection' },
  { label: 'Viewer dashboard', href: '/dashboard/user' },
  { label: 'Sign in', href: '/auth/sign-in' },
] as const;

export function Navbar() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.slug ?? 'education');
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const setActiveRole = useSessionStore((state) => state.setActiveRole);
  const signOut = useSessionStore((state) => state.signOut);
  const theme = useSessionStore((state) => state.theme);
  const toggleTheme = useSessionStore((state) => state.toggleTheme);
  const sessionRoles = getSessionRoles(session);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', session?.user.id],
    queryFn: webApi.getNotifications,
    enabled: Boolean(session),
  });

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    navigate(dashboardPathForRole(role));
  };

  const handleSignOut = () => {
    signOut();
    navigate('/auth/sign-in');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-canvas/55 shadow-[0_18px_50px_rgba(8,29,26,0.08)] backdrop-blur-[28px]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="min-w-0 space-y-1">
            <p className="text-lg font-semibold tracking-[-0.04em]">{brand.name}</p>
            <p className="truncate text-[11px] uppercase tracking-[0.24em] text-muted">
              Premium live learning
            </p>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink
              className="rounded-full border border-white/35 bg-white/25 px-4 py-2 text-sm text-muted backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/35 hover:text-text"
              to="/categories/education"
            >
              Explore
            </NavLink>
            <NavLink
              className="rounded-full border border-white/35 bg-white/25 px-4 py-2 text-sm text-muted backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/35 hover:text-text"
              to="/auth/role-selection"
            >
              Roles
            </NavLink>
            <NavLink
              className="rounded-full border border-white/35 bg-white/25 px-4 py-2 text-sm text-muted backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/35 hover:text-text"
              to="/dashboard/user"
            >
              Dashboard
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="rounded-full border border-white/35 bg-white/25 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl transition hover:border-white/50 hover:bg-white/35 hover:text-text"
              onClick={toggleTheme}
              type="button"
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
            {session ? (
              <div className="hidden items-center gap-3 md:flex">
                {sessionRoles.length > 1 ? (
                  <div className="inline-flex rounded-full border border-white/35 bg-white/22 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl">
                    {sessionRoles.map((role) => (
                      <button
                        key={role}
                        className={cx(
                          'rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition',
                          session.user.role === role
                            ? 'bg-white/55 text-text shadow-glass'
                            : 'text-muted hover:text-text',
                        )}
                        onClick={() => switchRole(role)}
                        type="button"
                      >
                        {roleLabel(role)}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="relative">
                  <button
                    className="rounded-full border border-white/35 bg-white/25 px-3 py-2 text-sm text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl transition hover:border-white/50 hover:bg-white/35 hover:text-text"
                    onClick={() => setNotificationsOpen((current) => !current)}
                    type="button"
                  >
                    <Badge tone="accent">
                      {notificationsQuery.data?.items.filter((item) => !item.read).length ?? 0} new
                    </Badge>
                  </button>
                  {notificationsOpen ? (
                    <div className="glass-card absolute right-0 top-14 w-80 rounded-[28px] p-4 shadow-glass-lg">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium">Notifications</p>
                        <Link className="text-xs text-muted" to="/notifications">
                          View all
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {notificationsQuery.data?.items.slice(0, 3).map((item) => (
                          <div className="rounded-[22px] border border-white/30 bg-white/25 p-3 backdrop-blur-xl" key={item.id}>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
                          </div>
                        )) ?? <p className="text-sm text-muted">No notifications yet.</p>}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Link className="text-sm font-medium" to={dashboardPathForRole(session.user.role)}>
                    {session.user.fullName}
                  </Link>
                  <Badge tone={session.user.role === 'admin' || session.user.role === 'moderator' ? 'warning' : 'accent'}>
                    {roleLabel(session.user.role)}
                  </Badge>
                  <Button onClick={handleSignOut} size="sm" variant="ghost">
                    Sign out
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/auth/sign-in">
                  <Button size="sm" variant="ghost">
                    Sign in
                  </Button>
                </Link>
                <Link to="/auth/sign-up">
                  <Button size="sm">Join LiveGate</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-white/25 bg-white/18 px-4 py-3 backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Browse categories</p>
              <p className="text-sm text-muted">Choose a category from one menu instead of scanning a long list.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {session && sessionRoles.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto">
                  {sessionRoles.map((role) => (
                    <button
                      key={role}
                      className={cx(
                        'whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur-xl transition',
                        session.user.role === role
                          ? 'border-white/55 bg-white/45 text-text'
                          : 'border-white/35 bg-white/25 text-muted',
                      )}
                      onClick={() => switchRole(role)}
                      type="button"
                    >
                      {roleLabel(role)}
                    </button>
                  ))}
                </div>
              ) : null}
              <select
                aria-label="Choose category"
                className="min-w-[220px] rounded-full border border-white/35 bg-white/25 px-4 py-2.5 text-sm text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] outline-none backdrop-blur-xl transition focus:border-white/55 focus:bg-white/35"
                onChange={(event) => setSelectedCategory(event.target.value)}
                value={selectedCategory}
              >
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.title}
                  </option>
                ))}
              </select>
              <Button onClick={() => navigate(`/categories/${selectedCategory}`)} size="sm">
                Open category
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 px-4 pb-6 pt-4 sm:mt-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="glass-full relative overflow-hidden rounded-[34px] px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-warning/15 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_0.9fr_0.9fr]">
            <div className="min-w-0 space-y-4">
              <div className="space-y-2">
                <p className="text-xl font-semibold tracking-[-0.04em]">{brand.name}</p>
                <p className="max-w-xl text-sm leading-7 text-muted">{brand.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/35 bg-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted">
                  Paid lives
                </span>
                <span className="rounded-full border border-white/35 bg-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted">
                  Premium content
                </span>
                <span className="rounded-full border border-white/35 bg-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted">
                  Structured classes
                </span>
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Navigate</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    className="rounded-[20px] border border-white/30 bg-white/20 px-4 py-3 text-sm text-muted backdrop-blur-xl transition hover:border-white/45 hover:bg-white/30 hover:text-text"
                    to={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.slug}
                    className="rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-xl transition hover:border-white/45 hover:bg-white/30 hover:text-text"
                    to={`/categories/${category.slug}`}
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
              <div className="rounded-[24px] border border-white/30 bg-white/18 p-4 text-sm leading-6 text-muted backdrop-blur-xl">
                Creators keep 80% from successful purchases while LiveGate handles access checks,
                platform controls, and the 20% commission layer behind the scenes.
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/20 pt-5 text-[11px] uppercase tracking-[0.18em] text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Access verified server-side</span>
            <span>Designed to stay calm on web, tablet, and mobile screens</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="relative z-[1] flex-1">{children}</main>
      <Footer />
      <AssistantDock />
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
    <Card className="sticky top-24 space-y-3 p-4">
      <p className="px-2 text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            className={({ isActive }) =>
              cx(
                'block rounded-[20px] px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-white/45 text-text shadow-glass'
                  : 'text-muted hover:bg-white/25 hover:text-text',
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
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <div className="hidden lg:block">
          <Sidebar title={sidebarTitle} items={sidebarItems} />
        </div>
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
    <Card className="hero-glow overflow-hidden border-white/40 shadow-glass-lg">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
          <h1 className="text-balance max-w-3xl text-4xl font-semibold tracking-[-0.06em] sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">{body}</p>
          {action}
        </div>
        <div className="rounded-[28px] border border-white/35 bg-white/20 p-5 backdrop-blur-2xl">
          <p className="text-sm leading-7 text-muted">
            LiveGate keeps the experience visually restrained while enforcing access control,
            payment-gated lives, creator pricing, and a clear 20% platform commission.
          </p>
        </div>
      </div>
    </Card>
  );
}

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

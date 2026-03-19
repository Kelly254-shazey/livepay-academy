import { brand, categories } from '@livegate/shared';
import type { UserRole } from '@livegate/shared';
import { type ReactNode, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { webApi } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';
import { Badge, Button, Card, cx } from '@/components/ui';

export function Navbar() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const session = useSessionStore((state) => state.session);
  const theme = useSessionStore((state) => state.theme);
  const toggleTheme = useSessionStore((state) => state.toggleTheme);

  const notificationsQuery = useQuery({
    queryKey: ['notifications', session?.user.id],
    queryFn: webApi.getNotifications,
    enabled: Boolean(session),
  });

  return (
    <header className="sticky top-0 z-40 border-b border-stroke/70 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="space-y-1">
          <p className="text-lg font-semibold tracking-[-0.03em]">{brand.name}</p>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Premium live learning</p>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink className="rounded-full px-4 py-2 text-sm text-muted transition hover:bg-surface hover:text-text" to="/categories/education">
            Explore
          </NavLink>
          <NavLink className="rounded-full px-4 py-2 text-sm text-muted transition hover:bg-surface hover:text-text" to="/auth/role-selection">
            Roles
          </NavLink>
          <NavLink className="rounded-full px-4 py-2 text-sm text-muted transition hover:bg-surface hover:text-text" to="/dashboard/user">
            Dashboard
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-stroke bg-surface/70 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:border-text/20 hover:text-text"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          {session ? (
            <div className="hidden items-center gap-3 md:flex">
              <div className="relative">
                <button
                  className="rounded-full border border-stroke bg-surface/70 px-3 py-2 text-sm text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:border-text/20 hover:text-text"
                  onClick={() => setNotificationsOpen((current) => !current)}
                  type="button"
                >
                  <Badge tone="accent">
                    {notificationsQuery.data?.items.filter((item) => !item.read).length ?? 0} new
                  </Badge>
                </button>
                {notificationsOpen ? (
                  <div className="absolute right-0 top-14 w-80 rounded-[28px] border border-stroke bg-surface p-4 shadow-panel">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Notifications</p>
                      <Link className="text-xs text-muted" to="/notifications">
                        View all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {notificationsQuery.data?.items.slice(0, 3).map((item) => (
                        <div className="rounded-2xl bg-surface-muted p-3" key={item.id}>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
                        </div>
                      )) ?? <p className="text-sm text-muted">No notifications yet.</p>}
                    </div>
                  </div>
                ) : null}
              </div>
              <Link className="text-sm font-medium" to={dashboardPathForRole(session.user.role)}>
                {session.user.fullName}
              </Link>
            </div>
          ) : (
            <>
              <Link to="/auth/sign-in">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/auth/sign-up">
                <Button>Join LiveGate</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-6 pb-4 md:flex">
        {categories.map((category) => (
          <Link
            key={category.slug}
            className="rounded-full border border-stroke bg-surface/65 px-3 py-1.5 text-xs font-medium text-muted transition hover:-translate-y-0.5 hover:border-text/30 hover:bg-surface hover:text-text"
            to={`/categories/${category.slug}`}
          >
            {category.title}
          </Link>
        ))}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-stroke/80 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-lg font-semibold">{brand.name}</p>
          <p className="max-w-xl text-sm leading-6 text-muted">{brand.description}</p>
        </div>
        <div className="text-sm text-muted">Prepared for real API integration across web and mobile clients.</div>
      </div>
    </footer>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
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
    <Card className="sticky top-24 space-y-3 p-4">
      <p className="px-2 text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            className={({ isActive }) =>
              cx(
                'block rounded-2xl px-3 py-2 text-sm transition',
                isActive ? 'bg-surface-muted text-text shadow-lift' : 'text-muted hover:bg-surface-muted/60 hover:text-text',
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
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[260px_minmax(0,1fr)]">
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
    <Card className="hero-glow overflow-hidden border-white/40">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
          <h1 className="text-balance max-w-3xl text-5xl font-semibold tracking-[-0.06em] md:text-6xl">{title}</h1>
          <p className="max-w-2xl text-base leading-7 text-muted">{body}</p>
          {action}
        </div>
        <div className="rounded-[28px] border border-white/50 bg-surface/80 p-5 shadow-lift">
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

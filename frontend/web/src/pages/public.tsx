import {
  brand,
  categories,
  demoParticipants,
  productRules,
  type DemoParticipant,
} from '@livegate/shared';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HeroPanel, PageFrame } from '@/components/layout';
import {
  CategoryPill,
  ClassCard,
  ContentCard,
  CreatorCard,
  LiveCard,
} from '@/components/domain';
import { webApi } from '@/lib/api';
import { Badge, Button, Card, EmptyState, LoadingBlock, SectionTitle, StatCard } from '@/components/ui';

const publicModes = [
  {
    id: 'viewer',
    title: 'Viewer mode',
    body: 'Pay for premium lives, unlock content, and build a polished learning library without clutter.',
    href: '/auth/role-selection',
    cta: 'Explore as viewer',
    badge: 'Audience',
  },
  {
    id: 'creator',
    title: 'Creator mode',
    body: 'Host paid live sessions, publish premium content, and manage serious earnings from one studio.',
    href: '/auth/role-selection',
    cta: 'Start as creator',
    badge: 'Monetization',
  },
  {
    id: 'hybrid',
    title: 'Hybrid mode',
    body: 'Operate as both viewer and creator from one account, then switch context without signing out.',
    href: '/auth/role-selection',
    cta: 'Use both roles',
    badge: 'Flexible identity',
  },
] as const;

const launchFlow = [
  {
    title: 'Discover with intention',
    body: 'Browse by category, creator, or recommendation with pricing and access state visible early.',
  },
  {
    title: 'Pay before access',
    body: 'Lives, premium content, and classes stay locked until server-side access is verified.',
  },
  {
    title: 'Switch roles cleanly',
    body: 'One account can act as viewer and creator, while staff access stays off the public path.',
  },
] as const;

const appHighlights = [
  {
    title: 'Join paid lives on the move',
    body: 'Live reminders, room access, and wallet history stay easier to act on from the app.',
  },
  {
    title: 'Run creator operations from your pocket',
    body: 'Create live sessions, check payouts, and review library inventory without waiting for a desktop session.',
  },
  {
    title: 'Keep the full product synced',
    body: 'Web stays excellent for browsing and depth, while the app keeps time-sensitive actions within reach.',
  },
] as const;

function QuerySection<T>({
  title,
  body,
  items,
  isLoading,
  error,
  render,
}: {
  title: string;
  body: string;
  items: T[] | undefined;
  isLoading: boolean;
  error: Error | null;
  render: (item: T) => ReactNode;
}) {
  return (
    <section className="space-y-6">
      <SectionTitle title={title} body={body} />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingBlock key={index} lines={5} />
          ))}
        </div>
      ) : error ? (
        <EmptyState title={`${title} unavailable`} body={error.message} />
      ) : items?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{items.map(render)}</div>
      ) : (
        <EmptyState
          title={`No ${title.toLowerCase()} yet`}
          body="This section is ready for production responses and will populate as soon as the backend returns results."
        />
      )}
    </section>
  );
}

function DemoAccountCard({ participant }: { participant: DemoParticipant }) {
  return (
    <Card className="space-y-4 transition duration-200 hover:-translate-y-1 hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-[-0.03em]">{participant.fullName}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{participant.roleLabel}</p>
        </div>
        <Badge tone="accent">Demo</Badge>
      </div>
      <p className="text-sm leading-6 text-muted">{participant.summary}</p>
      <div className="flex flex-wrap gap-2">
        {participant.roles.map((role) => (
          <Badge key={role}>{role}</Badge>
        ))}
      </div>
      <p className="text-sm text-muted">{participant.email}</p>
      <Link to={`/auth/sign-in?demo=${participant.id}`}>
        <Button className="w-full">Open this demo account</Button>
      </Link>
    </Card>
  );
}

export function LandingPage() {
  const homeQuery = useQuery({
    queryKey: ['home-feed'],
    queryFn: webApi.getHomeFeed,
  });
  const publicDemoAccounts = demoParticipants.filter((participant) => participant.audience === 'public');

  return (
    <PageFrame>
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 sm:space-y-14">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_380px]">
          <HeroPanel
            action={
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Link to="/auth/role-selection">
                    <Button size="lg">Choose your role</Button>
                  </Link>
                  <Link to="/auth/sign-in?demo=demo-hybrid">
                    <Button size="lg" variant="secondary">
                      Open demo workspace
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">📱 Also available on mobile</p>
                  <div className="flex flex-wrap gap-2">
                    <a href="https://apps.apple.com/app/livegate" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary" className="gap-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.05 13.5c-.02-2.22 1.82-3.28 1.84-3.3-1-1.46-2.54-1.66-3.09-1.68-1.31-.14-2.56.78-3.22.78-.64 0-1.63-.76-2.68-.73-1.38.03-2.65.8-3.36 2.03-.143.247-.267.505-.37.77-.752 2.289-.204 5.258 1.4 6.982.94 1.37 2.07 2.85 3.56 2.8 1.44-.05 1.99-.94 3.74-.94 1.74 0 2.26.94 3.76.91 1.55-.03 2.53-1.39 3.46-2.76.966-1.436 1.41-2.94 1.44-3.02-.03-.02-3.03-1.17-3.06-4.63z"/>
                        </svg>
                        App Store
                      </Button>
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=com.livegate" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary" className="gap-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 13.5v8.5c0 1.1.9 2 2 2h4v-6h3v6h4c1.1 0 2-.9 2-2v-8.5M6.5 1.5h11c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-11c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2z"/>
                        </svg>
                        Play Store
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            }
            body="LiveGate is a premium product for paid live sessions, locked content, structured classes, and serious creator monetization across education, business, trading, mentorship, wellness, and entertainment. Available on web and mobile for seamless access anywhere."
            eyebrow="Premium live learning • Web & Mobile"
            title="A calmer way to sell expertise, join live sessions, and unlock paid knowledge."
          />

          <Card className="space-y-5">
            <div className="space-y-2">
              <Badge tone="accent">At a glance</Badge>
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">Simple outside, disciplined underneath.</h2>
              <p className="text-sm leading-7 text-muted">{brand.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[24px] border border-white/35 bg-white/22 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Commission split</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">80 / 20</p>
                <p className="mt-1 text-sm text-muted">Creators keep 80%, platform retains 20%.</p>
              </div>
              <div className="rounded-[24px] border border-white/35 bg-white/22 p-4 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Role model</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Hybrid</p>
                <p className="mt-1 text-sm text-muted">One account can switch between viewer and creator context.</p>
              </div>
              <div className="rounded-[24px] border border-white/35 bg-white/22 p-4 backdrop-blur-xl sm:col-span-2 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Staff access</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Hidden</p>
                <p className="mt-1 text-sm text-muted">Admins and moderators use a separate restricted portal.</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionTitle
            eyebrow="Roles"
            body="Public onboarding stays deliberately narrow: viewer, creator, or both. Staff access is intentionally separate."
            title="Choose a mode that matches how you use the platform"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {publicModes.map((mode) => (
              <Card className="space-y-5 transition duration-200 hover:-translate-y-1 hover:shadow-panel" key={mode.id}>
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="accent">{mode.badge}</Badge>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{mode.id}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold tracking-[-0.04em]">{mode.title}</h3>
                  <p className="text-sm leading-7 text-muted">{mode.body}</p>
                </div>
                <Link to={mode.href}>
                  <Button className="w-full" variant={mode.id === 'creator' ? 'primary' : 'secondary'}>
                    {mode.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <Card className="space-y-5">
            <div className="space-y-3">
              <Badge tone="success">AI concierge</Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.05em]">A built-in assistant for orientation, dashboards, and monetization flow.</h2>
              <p className="max-w-3xl text-sm leading-7 text-muted">
                Both web and mobile now include an AI concierge surface that helps users navigate
                roles, understand payouts, find dashboards, and orient themselves without adding
                noisy UI chrome.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {launchFlow.map((step) => (
                <div className="rounded-[24px] border border-white/35 bg-white/22 p-4 backdrop-blur-xl" key={step.title}>
                  <p className="font-semibold tracking-[-0.02em]">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <StatCard
              detail="Supported categories with distinct discovery surfaces."
              label="Categories"
              value={String(categories.length)}
            />
            <StatCard
              detail="Preview accounts for audience, creator, and hybrid workflows."
              label="Demo participants"
              value={String(publicDemoAccounts.length)}
            />
            <StatCard
              detail="Access remains verified server-side before paid joins and unlocks."
              label="Trust model"
              value="Strict"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-10 top-6 h-28 rounded-full bg-accent/20 blur-3xl" />
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="mx-auto flex w-full max-w-[220px] items-center justify-center">
                <div className="relative h-[430px] w-[220px] rounded-[40px] border border-white/40 bg-[#0f1d1a] p-3 shadow-[0_28px_80px_rgba(7,24,21,0.28)]">
                  <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/20" />
                  <div className="flex h-full flex-col gap-3 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(234,252,246,0.98),rgba(216,239,232,0.92))] p-4">
                    <div className="rounded-[22px] border border-white/60 bg-white/60 p-3 backdrop-blur-xl">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">LiveGate app</p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-text">Session-ready everywhere</p>
                      <p className="mt-2 text-xs leading-5 text-muted">Live reminders, checkout clarity, and creator controls built for mobile rhythm.</p>
                    </div>
                    <div className="grid gap-3">
                      <div className="rounded-[22px] border border-white/50 bg-white/55 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Upcoming live</p>
                        <p className="mt-1 font-semibold">Market Breakdown</p>
                        <p className="text-xs text-muted">$45 access • starts in 45 min</p>
                      </div>
                      <div className="rounded-[22px] border border-white/40 bg-white/40 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Creator wallet</p>
                        <p className="mt-1 font-semibold">$1,840 available</p>
                        <p className="text-xs text-muted">Payouts and pending balance stay visible.</p>
                      </div>
                      <div className="rounded-[22px] border border-white/40 bg-accent/12 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-accent">AI concierge</p>
                        <p className="mt-1 text-sm font-semibold text-text">Find the fastest route to your next action.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <SectionTitle
                  eyebrow="Mobile-first moments"
                  body="The web experience handles discovery and depth well, but the app is where LiveGate feels fastest for reminders, checkout follow-through, creator operations, and room access."
                  title="Use the app when timing matters"
                />
                <div className="grid gap-3">
                  {appHighlights.map((item) => (
                    <div className="rounded-[24px] border border-white/35 bg-white/22 p-4 backdrop-blur-xl" key={item.title}>
                      <p className="font-semibold tracking-[-0.02em]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/auth/sign-in?demo=demo-hybrid">
                    <Button>Open the app-ready demo flow</Button>
                  </Link>
                  <Link to="/auth/sign-up">
                    <Button variant="secondary">Create an account for mobile</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <SectionTitle
            eyebrow="Demo access"
            body="Use these public demo participants to inspect the dashboards, navigation paths, and AI-assisted flows without waiting for live backend data."
            title="Preview the product with real role-based demo identities"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {publicDemoAccounts.map((participant) => (
              <DemoAccountCard key={participant.id} participant={participant} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionTitle
            eyebrow="Browse"
            body="Every category stays explicit, so discovery remains legible even as the product grows."
            title="Built around clear category navigation"
          />
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <CategoryPill href={`/categories/${category.slug}`} key={category.slug} title={category.title} />
            ))}
          </div>
        </section>

        <QuerySection
          body="These creator cards show who is currently worth following, teaching, or paying attention to."
          error={homeQuery.error as Error | null}
          isLoading={homeQuery.isLoading}
          items={homeQuery.data?.featuredCreators}
          render={(creator) => <CreatorCard creator={creator} key={creator.id} />}
          title="Featured creators"
        />

        <QuerySection
          body="Paid live sessions surface price, timing, host identity, and access state without visual noise."
          error={homeQuery.error as Error | null}
          isLoading={homeQuery.isLoading}
          items={homeQuery.data?.trendingLives}
          render={(live) => <LiveCard key={live.id} live={live} />}
          title="Trending live sessions"
        />

        <QuerySection
          body="Premium tutorials, replay packs, and downloadable learning products stay clearly separated from live inventory."
          error={homeQuery.error as Error | null}
          isLoading={homeQuery.isLoading}
          items={homeQuery.data?.premiumContent}
          render={(content) => <ContentCard content={content} key={content.id} />}
          title="Premium content"
        />

        <QuerySection
          body="Structured classes and workshops stay teacher-led, schedule-aware, and payment-gated."
          error={homeQuery.error as Error | null}
          isLoading={homeQuery.isLoading}
          items={homeQuery.data?.recommendedClasses}
          render={(classItem) => <ClassCard classItem={classItem} key={classItem.id} />}
          title="Recommended classes"
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Card className="space-y-5">
            <SectionTitle
              eyebrow="Rules"
              body="The product surface stays elegant because the underlying rules are unambiguous."
              title="Business logic that remains visible where it matters"
            />
            <div className="grid gap-3">
              {productRules.map((rule) => (
                <div className="rounded-[24px] border border-white/35 bg-white/22 px-4 py-3 text-sm leading-6 text-muted backdrop-blur-xl" key={rule}>
                  {rule}
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <SectionTitle
              eyebrow="Product posture"
              body="LiveGate is designed to feel premium and quiet while still exposing the right control surfaces for creators, viewers, and staff."
              title="The experience stays polished because the boundaries stay clean"
            />
            <p className="text-sm leading-7 text-muted">
              Public users see only the paths they need. Hybrid users can switch contexts. Staff use
              a separate hidden portal. Payments, access grants, commissions, and payouts stay
              backend-owned and auditable.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth/sign-up">
                <Button>Open an account</Button>
              </Link>
              <Link to="/auth/sign-in?demo=demo-viewer">
                <Button variant="secondary">Preview viewer flow</Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </PageFrame>
  );
}

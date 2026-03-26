import {
  brand,
  categories,
  demoParticipants,
  productRules,
  type DemoParticipant,
} from '../lib/shared';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HeroPanel, PageFrame } from '@/components/layout';
import {
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
    body: 'Choose a category from the menu, compare creators cleanly, and see pricing before you commit.',
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
                <div className="rounded-[24px] border border-white/35 bg-white/18 p-4 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Mobile access</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Live reminders, room entry, and creator controls stay visible on mobile, so the app awareness remains in the hero where it belongs.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href="https://apps.apple.com/app/livegate" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary">
                        App Store
                      </Button>
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=com.livegate" target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary">
                        Play Store
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            }
            body="LiveGate is a premium product for paid live sessions, locked content, structured classes, and serious creator monetization across education, business, trading, mentorship, wellness, and entertainment. Available on web and mobile for seamless access anywhere."
            eyebrow="Premium live learning | Web and Mobile"
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
                Both web and mobile include an AI concierge surface that helps users navigate roles,
                understand payouts, find dashboards, and orient themselves without adding noisy UI chrome.
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

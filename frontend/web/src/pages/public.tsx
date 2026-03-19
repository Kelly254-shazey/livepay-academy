import { categories, productRules } from '@livegate/shared';
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
import { Button, Card, EmptyState, LoadingBlock, SectionTitle } from '@/components/ui';

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
          body="This section is connected to the production API contract and will fill as soon as your backend begins returning results."
        />
      )}
    </section>
  );
}

export function LandingPage() {
  const homeQuery = useQuery({
    queryKey: ['home-feed'],
    queryFn: webApi.getHomeFeed,
  });

  return (
    <PageFrame>
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
        <HeroPanel
          action={
            <div className="flex flex-wrap gap-3">
              <Link to="/auth/role-selection">
                <Button>Start earning</Button>
              </Link>
              <Link to="/categories/education">
                <Button variant="secondary">Browse LiveGate</Button>
              </Link>
            </div>
          }
          body="LiveGate is a premium platform for paid live sessions, locked content, and structured classes across education, trading, business, wellness, mentorship, and more."
          eyebrow="Creator economy, refined"
          title="A calm, premium monetization layer for live expertise."
        />

        <section className="space-y-6">
          <SectionTitle
            eyebrow="Taxonomy"
            body="Each category has its own browsing context, filtering flow, and dedicated discovery surface."
            title="Built for clear category discovery"
          />
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <CategoryPill href={`/categories/${category.slug}`} key={category.slug} title={category.title} />
            ))}
          </div>
        </section>

        <QuerySection
          body="Featured creator modules are API-driven and will populate once creator data is available."
          error={homeQuery.error as Error | null}
          isLoading={homeQuery.isLoading}
          items={homeQuery.data?.featuredCreators}
          render={(creator) => <CreatorCard creator={creator} key={creator.id} />}
          title="Featured creators"
        />

        <QuerySection
          body="Trending paid lives appear here with pricing, audience state, and direct entry into checkout or live details."
          error={homeQuery.error as Error | null}
          isLoading={homeQuery.isLoading}
          items={homeQuery.data?.trendingLives}
          render={(live) => <LiveCard key={live.id} live={live} />}
          title="Trending live sessions"
        />

        <QuerySection
          body="Premium tutorials, replays, downloadable materials, and locked lessons sit behind these API-powered cards."
          error={homeQuery.error as Error | null}
          isLoading={homeQuery.isLoading}
          items={homeQuery.data?.premiumContent}
          render={(content) => <ContentCard content={content} key={content.id} />}
          title="Premium content"
        />

        <QuerySection
          body="Classes and workshops remain structured, price-aware, and teacher-led, ready for real schedules and lesson payloads."
          error={homeQuery.error as Error | null}
          isLoading={homeQuery.isLoading}
          items={homeQuery.data?.recommendedClasses}
          render={(classItem) => <ClassCard classItem={classItem} key={classItem.id} />}
          title="Recommended classes"
        />

        <section className="grid gap-4 lg:grid-cols-3">
          {productRules.map((rule) => (
            <Card className="space-y-3" key={rule}>
              <div className="h-10 w-10 rounded-2xl bg-accent-muted" />
              <p className="text-sm leading-7 text-muted">{rule}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <SectionTitle
              eyebrow="How it works"
              body="Creators price their own live sessions, content, and classes while the platform automatically enforces purchase-before-access."
              title="Monetization without noisy UX"
            />
            <ol className="space-y-3 text-sm leading-7 text-muted">
              <li>1. Creators publish paid lives, premium content, and structured classes.</li>
              <li>2. Users discover by category, creator, or direct recommendations.</li>
              <li>3. Checkout unlocks access, while LiveGate retains the 20% platform commission.</li>
            </ol>
          </Card>
          <Card className="space-y-4">
            <SectionTitle
              eyebrow="Trust"
              body="The frontend is prepared for verification, moderation, admin oversight, suspicious payment review, and role-based routing."
              title="Serious enough for investors and premium creators"
            />
            <p className="text-sm leading-7 text-muted">
              The product surface stays calm while the architecture underneath anticipates audit trails,
              flagged content, payout reviews, verification states, and transaction-level controls.
            </p>
          </Card>
        </section>
      </div>
    </PageFrame>
  );
}

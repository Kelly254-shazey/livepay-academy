import { brand, formatCompactNumber, formatCurrency, formatDateTime } from '../lib/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HeroPanel, PageFrame } from '@/components/layout';
import { webApi } from '@/lib/api';
import { Badge, Button, Card, EmptyState, LoadingBlock, SectionTitle } from '@/components/ui';

function FeedCard({
  title,
  body,
  meta,
  href,
  action,
}: {
  title: string;
  body: string;
  meta: string;
  href: string;
  action: string;
}) {
  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted">{meta}</p>
        <h3 className="text-xl font-semibold tracking-[-0.03em]">{title}</h3>
        <p className="text-sm leading-6 text-muted">{body}</p>
      </div>
      <Link className="text-sm font-medium text-accent" to={href}>
        {action}
      </Link>
    </Card>
  );
}

export function LandingPage() {
  const homeQuery = useQuery({
    queryKey: ['home-feed'],
    queryFn: webApi.getHomeFeed,
  });

  return (
    <PageFrame>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <HeroPanel
          action={
            <div className="flex flex-wrap gap-3">
              <Link to="/auth/role-selection">
                <Button>Choose role</Button>
              </Link>
              <Link to="/auth/sign-in">
                <Button variant="secondary">Sign in</Button>
              </Link>
              <Link to="/staff/portal">
                <Button variant="ghost">Staff portal</Button>
              </Link>
            </div>
          }
          body="Buy access to live sessions, premium content, and classes. Creators publish and get paid. Staff review through a separate portal. Auth, checkout, and access stay backend-controlled."
          eyebrow="Minimal web surface"
          title="Paid learning and creator commerce without unnecessary UI."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="space-y-2">
            <p className="text-sm text-muted">Platform</p>
            <p className="text-2xl font-semibold tracking-[-0.03em]">{brand.name}</p>
            <p className="text-sm leading-6 text-muted">{brand.tagline}</p>
          </Card>
          <Card className="space-y-2">
            <p className="text-sm text-muted">Discovery</p>
            <p className="text-2xl font-semibold tracking-[-0.03em]">
              {homeQuery.data?.categories.length ?? 0}
            </p>
            <p className="text-sm leading-6 text-muted">Categories returned directly from the backend home feed.</p>
          </Card>
          <Card className="space-y-2">
            <p className="text-sm text-muted">Core rule</p>
            <p className="text-2xl font-semibold tracking-[-0.03em]">Access is verified</p>
            <p className="text-sm leading-6 text-muted">The web UI stays light because payment and access logic stay server-side.</p>
          </Card>
        </section>

        <section className="space-y-4">
          <SectionTitle
            body="Pick a category and go straight into live backend-backed inventory."
            title="Browse categories"
          />
          {homeQuery.isLoading ? (
            <LoadingBlock lines={4} />
          ) : homeQuery.isError ? (
            <EmptyState body={(homeQuery.error as Error).message} title="Categories unavailable" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {homeQuery.data?.categories.map((category) => (
                <Link key={category.slug} to={`/categories/${category.slug}`}>
                  <Badge variant="default">{category.title}</Badge>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <SectionTitle
            body="The homepage only surfaces the most actionable records: who to follow, what is live, and what can be bought."
            title="Useful now"
          />
          {homeQuery.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <LoadingBlock lines={5} />
              <LoadingBlock lines={5} />
              <LoadingBlock lines={5} />
            </div>
          ) : homeQuery.isError ? (
            <EmptyState body={(homeQuery.error as Error).message} title="Home feed unavailable" />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted">Featured creators</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Who is worth following</h2>
                </div>
                <div className="space-y-3">
                  {homeQuery.data?.featuredCreators.slice(0, 3).map((creator) => (
                    <div className="border-t border-stroke pt-3 first:border-t-0 first:pt-0" key={creator.id}>
                      <p className="font-medium">{creator.displayName}</p>
                      <p className="text-sm text-muted">{creator.headline}</p>
                      <p className="mt-1 text-sm text-muted">
                        {formatCompactNumber(creator.followerCount)} followers
                      </p>
                      <Link className="mt-2 inline-block text-sm font-medium text-accent" to={`/creators/${creator.id}`}>
                        View creator
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted">Trending lives</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">What is happening soon</h2>
                </div>
                <div className="space-y-3">
                  {homeQuery.data?.trendingLives.slice(0, 3).map((live) => (
                    <div className="border-t border-stroke pt-3 first:border-t-0 first:pt-0" key={live.id}>
                      <p className="font-medium">{live.title}</p>
                      <p className="text-sm text-muted">{live.creator.displayName}</p>
                      <p className="mt-1 text-sm text-muted">
                        {live.isPaid ? formatCurrency(live.price, live.currency) : 'Free'} · {formatDateTime(live.startTime)}
                      </p>
                      <Link className="mt-2 inline-block text-sm font-medium text-accent" to={`/lives/${live.id}`}>
                        View live
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted">Locked products</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Content and classes</h2>
                </div>
                <div className="space-y-3">
                  {homeQuery.data?.premiumContent.slice(0, 2).map((content) => (
                    <div className="border-t border-stroke pt-3 first:border-t-0 first:pt-0" key={content.id}>
                      <p className="font-medium">{content.title}</p>
                      <p className="text-sm text-muted">
                        {formatCurrency(content.price, content.currency)} · {content.creator.displayName}
                      </p>
                      <Link className="mt-2 inline-block text-sm font-medium text-accent" to={`/content/${content.id}`}>
                        View content
                      </Link>
                    </div>
                  ))}
                  {homeQuery.data?.recommendedClasses.slice(0, 1).map((classItem) => (
                    <div className="border-t border-stroke pt-3" key={classItem.id}>
                      <p className="font-medium">{classItem.title}</p>
                      <p className="text-sm text-muted">
                        {formatCurrency(classItem.price)} · {classItem.scheduleLabel}
                      </p>
                      <Link className="mt-2 inline-block text-sm font-medium text-accent" to={`/classes/${classItem.id}`}>
                        View class
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <FeedCard
            action="Start as viewer"
            body="Sign in, buy access, and keep your library in one place."
            href="/auth/role-selection"
            meta="Viewer"
            title="Join paid sessions and unlock premium content"
          />
          <FeedCard
            action="Start as creator"
            body="Create lives, publish content, and manage payouts from the creator dashboard."
            href="/auth/role-selection"
            meta="Creator"
            title="Sell expertise without needing a noisy studio"
          />
          <FeedCard
            action="Open staff access"
            body="Moderation and platform review remain separate from the public entry flow."
            href="/staff/portal"
            meta="Staff"
            title="Use the restricted backend-backed portal"
          />
        </section>
      </div>
    </PageFrame>
  );
}

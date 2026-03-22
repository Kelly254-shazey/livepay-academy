import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell, PageFrame } from '@/components/layout';
import { webApi } from '@/lib/api';
import { useSessionStore } from '@/store/session-store';
import {
  Button,
  Card,
  Badge,
  SectionTitle,
  LoadingBlock,
  EmptyState,
} from '@/components/ui';

export function UserDashboardPage() {
  const session = useSessionStore((state) => state.session);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');

  const isCreator = session?.user.roles?.includes('creator');
  const isAdmin = session?.user.roles?.includes('admin');
  const isModerator = session?.user.roles?.includes('moderator');

  const watchlistQuery = useQuery({
    queryKey: ['watchlist', session?.user.id],
    queryFn: async () => ({ items: [] }),
    enabled: Boolean(session),
  });

  const savedVideosQuery = useQuery({
    queryKey: ['saved-videos', session?.user.id],
    queryFn: async () => ({ items: [] }),
    enabled: Boolean(session),
  });

  const upcomingSessionsQuery = useQuery({
    queryKey: ['upcoming-sessions', session?.user.id],
    queryFn: async () => ({ items: [] }),
    enabled: Boolean(session),
  });

  const freeContentQuery = useQuery({
    queryKey: ['free-content'],
    queryFn: async () => ({ items: [] }),
  });

  const purchasedContentQuery = useQuery({
    queryKey: ['purchased-content', session?.user.id],
    queryFn: async () => ({ items: [] }),
    enabled: Boolean(session),
  });

  return (
    <PageFrame>
      <AppShell sidebarTitle="Dashboard" sidebarItems={[
        { label: 'Dashboard', href: '/dashboard/user' },
        ...(isCreator ? [{ label: 'Creator Studio', href: '/dashboard/creator' }] : []),
        ...(isAdmin || isModerator ? [{ label: 'Admin Panel', href: '/dashboard/admin' }] : []),
        { label: 'Settings', href: '/settings' },
      ]}>
        <div className="space-y-8">
          {/* Enhanced Header with Role Indicators */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h1 className="text-3xl font-bold text-text">
                  Welcome back, {session?.user.fullName?.split(' ')[0]}! 👋
                </h1>
                <p className="text-muted">Discover sessions, manage your content, and grow your audience</p>
              </div>
            </div>

            {/* Role Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge tone="default">👥 Viewer</Badge>
              {isCreator && <Badge tone="accent">🎬 Creator</Badge>}
              {isAdmin && <Badge tone="accent">⚙️ Admin</Badge>}
              {isModerator && <Badge tone="warning">🛡️ Moderator</Badge>}
            </div>
          </div>

          {/* Role-Specific Quick Actions */}
          {(isCreator || isAdmin || isModerator) && (
            <Card className="border-l-4 border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-semibold text-text mb-3">Quick Actions for Your Roles</p>
              <div className="flex flex-wrap gap-2">
                {isCreator && (
                  <Link to="/dashboard/creator">
                    <Button size="sm" variant="secondary">🎬 Go to Creator Studio</Button>
                  </Link>
                )}
                {(isAdmin || isModerator) && (
                  <Link to="/dashboard/admin">
                    <Button size="sm" variant="secondary">⚙️ Admin Panel</Button>
                  </Link>
                )}
                <Link to="/settings">
                  <Button size="sm" variant="secondary">⚙️ Settings</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Download App Promo */}
          <Card className="glass-hover relative overflow-hidden border-accent/30 bg-gradient-to-r from-accent/10 to-transparent p-6 md:flex md:items-center md:justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-text">📱 Get the mobile app</h3>
              <p className="text-sm text-muted">
                Join live sessions on the go, get instant notifications, and manage your library from anywhere.
              </p>
            </div>
            <div className="mt-4 flex gap-3 md:mt-0">
              <Button variant="secondary" size="sm">
                iOS App
              </Button>
              <Button variant="secondary" size="sm">
                Android App
              </Button>
            </div>
          </Card>

          {/* Tabs */}
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-stroke/30 overflow-x-auto">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'upcoming'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                Upcoming Sessions ({upcomingSessionsQuery.data?.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('free-content')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'free-content'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                Free Community ({freeContentQuery.data?.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'library'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                My Library ({savedVideosQuery.data?.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('purchased')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'purchased'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                Purchased Content ({purchasedContentQuery.data?.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'watchlist'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                Watchlist ({watchlistQuery.data?.items?.length || 0})
              </button>
            </div>

            {activeTab === 'upcoming' && (
              <UpcomingSessionsSection
                sessions={upcomingSessionsQuery.data?.items}
                isLoading={upcomingSessionsQuery.isLoading}
              />
            )}
            {activeTab === 'free-content' && (
              <FreeContentSection
                content={freeContentQuery.data?.items}
                isLoading={freeContentQuery.isLoading}
              />
            )}
            {activeTab === 'library' && (
              <LibrarySection
                videos={savedVideosQuery.data?.items}
                isLoading={savedVideosQuery.isLoading}
              />
            )}
            {activeTab === 'purchased' && (
              <PurchasedContentSection
                content={purchasedContentQuery.data?.items}
                isLoading={purchasedContentQuery.isLoading}
              />
            )}
            {activeTab === 'watchlist' && (
              <WatchlistSection
                items={watchlistQuery.data?.items}
                isLoading={watchlistQuery.isLoading}
              />
            )}
          </div>
        </div>
      </AppShell>
    </PageFrame>
  );
}

function UpcomingSessionsSection({ sessions, isLoading }: any) {
  if (isLoading) return <LoadingBlock lines={6} />;

  if (!sessions?.length) {
    return (
      <EmptyState
        title="No upcoming sessions"
        body="Browse creators and discover live sessions to join"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session: any) => (
        <Card key={session.id} className="overflow-hidden transition hover:shadow-panel">
          <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5" />
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="line-clamp-2 font-semibold text-text">{session.title}</h3>
                <p className="text-sm text-muted">{session.creatorName}</p>
              </div>
              {session.price > 0 && (
                <Badge tone="accent">${session.price}</Badge>
              )}
            </div>
            <p className="text-sm leading-5 text-muted">{session.description}</p>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>📅 {new Date(session.startTime).toLocaleDateString()}</span>
              <span>👥 {session.participantCount} joined</span>
            </div>
            <Link to={`/lives/${session.id}`}>
              <Button className="w-full" size="sm">
                View Session
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

function FreeContentSection({ content, isLoading }: any) {
  if (isLoading) return <LoadingBlock lines={8} />;

  if (!content?.length) {
    return (
      <EmptyState
        title="No free content available"
        body="Check back soon for free community content from creators"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {content.map((item: any) => (
        <Card key={item.id} className="overflow-hidden transition hover:shadow-panel">
          <div className="aspect-video bg-surface-muted relative group">
            <div className="absolute inset-0 flex items-center justify-center bg-accent/0 group-hover:bg-accent/10 transition">
              <p className="text-white text-3xl">▶</p>
            </div>
          </div>
          <div className="space-y-2 p-4">
            <h3 className="line-clamp-2 font-semibold text-text">{item.title}</h3>
            <p className="text-sm text-muted">{item.creator.name}</p>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>👁 {item.views} views</span>
              <span>❤ {item.likes}</span>
            </div>
            <Button variant="ghost" className="w-full" size="sm">
              Watch Free
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function LibrarySection({ videos, isLoading }: any) {
  if (isLoading) return <LoadingBlock lines={8} />;

  if (!videos?.length) {
    return (
      <EmptyState
        title="Your library is empty"
        body="Save videos from sessions to watch later or organize your collection"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video: any) => (
        <Card key={video.id} className="overflow-hidden transition hover:shadow-panel">
          <div className="aspect-video bg-surface-muted relative">
            <div className="absolute right-2 top-2 rounded-lg bg-accent/90 px-2 py-1">
              <p className="text-xs font-semibold text-surface">
                {Math.floor(video.savedProgress)}% watched
              </p>
            </div>
          </div>
          <div className="space-y-2 p-4">
            <h3 className="line-clamp-2 font-semibold text-text">{video.title}</h3>
            <div className="w-full bg-surface-muted rounded-full h-1">
              <div
                className="bg-accent h-1 rounded-full transition-all"
                style={{ width: Math.min(video.savedProgress || 0, 100) + '%' }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Button variant="ghost" size="sm">
                Continue
              </Button>
              <Button variant="ghost" size="sm">
                ⋯
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function PurchasedContentSection({ content, isLoading }: any) {
  if (isLoading) return <LoadingBlock lines={6} />;

  if (!content?.length) {
    return (
      <EmptyState
        title="No purchased content yet"
        body="Browse and purchase premium content from creators"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {content.map((item: any) => (
        <Card key={item.id} className="overflow-hidden transition hover:shadow-panel">
          <div className="aspect-video bg-surface-muted" />
          <div className="space-y-2 p-4">
            <h3 className="line-clamp-2 font-semibold text-text">{item.title}</h3>
            <p className="text-sm text-muted">{item.creator.name}</p>
            <p className="text-xs text-success">Purchased on {new Date(item.purchaseDate).toLocaleDateString()}</p>
            <Button className="w-full" size="sm">
              Watch
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function WatchlistSection({ items, isLoading }: any) {
  if (isLoading) return <LoadingBlock lines={6} />;

  if (!items?.length) {
    return (
      <EmptyState
        title="Watchlist is empty"
        body="Add sessions and content to your watchlist to keep track of what you want to watch"
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <Card key={item.id} className="flex items-center justify-between gap-4 p-4 transition hover:shadow-panel">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text line-clamp-1">{item.title}</h3>
            <p className="text-xs text-muted">{item.creator.name}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm">
              View
            </Button>
            <Button variant="ghost" size="sm">
              Remove
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

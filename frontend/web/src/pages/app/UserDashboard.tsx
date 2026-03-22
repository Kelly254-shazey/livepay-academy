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
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-accent/15 via-surface to-surface/80 p-8 md:p-12">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-warning/10 blur-3xl" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="space-y-3">
                <div className="flex items-end gap-2 flex-wrap">
                  <h1 className="text-4xl md:text-5xl font-bold text-text leading-tight">
                    Welcome back, {session?.user.fullName?.split(' ')[0]}!
                  </h1>
                  <span className="text-4xl md:text-5xl">👋</span>
                </div>
                <p className="text-lg text-muted max-w-2xl">
                  Discover live sessions from world-class creators, build your learning library, and join an engaged community.
                </p>
              </div>

              {/* Role Pills */}
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="px-4 py-2 rounded-full bg-accent/20 border border-accent/40 text-sm font-medium text-text">👥 Viewer</div>
                {isCreator && <div className="px-4 py-2 rounded-full bg-success/20 border border-success/40 text-sm font-medium text-text">🎬 Creator</div>}
                {isAdmin && <div className="px-4 py-2 rounded-full bg-accent/20 border border-accent/40 text-sm font-medium text-text">⚙️ Admin</div>}
                {isModerator && <div className="px-4 py-2 rounded-full bg-warning/20 border border-warning/40 text-sm font-medium text-text">🛡️ Moderator</div>}
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="group relative overflow-hidden p-6 border-accent/30 hover:border-accent/60 transition cursor-pointer">
              <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center text-xl">🔴</div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-text">Upcoming Sessions</h3>
                  <p className="text-sm text-muted">Join live learning sessions with expert creators</p>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Browse Sessions →
                </Button>
              </div>
            </Card>

            <Card className="group relative overflow-hidden p-6 border-success/30 hover:border-success/60 transition cursor-pointer">
              <div className="absolute inset-0 bg-success/0 group-hover:bg-success/5 transition" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center text-xl">📚</div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-text">My Library</h3>
                  <p className="text-sm text-muted">Access your saved videos and purchased content</p>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  View Library →
                </Button>
              </div>
            </Card>

            <Card className="group relative overflow-hidden p-6 border-warning/30 hover:border-warning/60 transition cursor-pointer">
              <div className="absolute inset-0 bg-warning/0 group-hover:bg-warning/5 transition" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center text-xl">⭐</div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-text">Watchlist</h3>
                  <p className="text-sm text-muted">Track sessions and content you want to check out</p>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  See Watchlist →
                </Button>
              </div>
            </Card>
          </div>

          {/* Multi-Role Actions */}
          {(isCreator || isAdmin || isModerator) && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-text">Your Roles</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {isCreator && (
                  <Link to="/dashboard/creator">
                    <Card className="group relative overflow-hidden p-6 border-success/30 hover:border-success/60 transition h-full">
                      <div className="absolute inset-0 bg-success/0 group-hover:bg-success/5 transition" />
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-text">Creator Studio</h3>
                          <span className="text-3xl">🎬</span>
                        </div>
                        <p className="text-muted">Manage live sessions, create premium content, and track earnings</p>
                        <Button size="sm" className="mt-4">
                          Access Creator Studio
                        </Button>
                      </div>
                    </Card>
                  </Link>
                )}
                {(isAdmin || isModerator) && (
                  <Link to="/dashboard/admin">
                    <Card className="group relative overflow-hidden p-6 border-accent/30 hover:border-accent/60 transition h-full">
                      <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition" />
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-text">{isAdmin ? 'Admin' : 'Moderator'} Dashboard</h3>
                          <span className="text-3xl">{isAdmin ? '⚙️' : '🛡️'}</span>
                        </div>
                        <p className="text-muted">{isAdmin ? 'Platform management, analytics, and system controls' : 'Community moderation and content safety'}</p>
                        <Button size="sm" className="mt-4">
                          Go to Dashboard
                        </Button>
                      </div>
                    </Card>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Mobile App Promo */}
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-r from-accent/10 to-warning/10 p-8 md:p-10">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl opacity-50" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3 flex-1">
                <h3 className="text-2xl font-bold text-text">📱 Take LiveGate Everywhere</h3>
                <p className="text-muted leading-relaxed">
                  Download the mobile app to join live sessions on the go, receive instant notifications, and manage your learning library from anywhere in the world.
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0 flex-col sm:flex-row">
                <Button variant="primary" size="sm">
                  iOS App
                </Button>
                <Button variant="primary" size="sm">
                  Android App
                </Button>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Section Header */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-text">Your Content</h2>
              <p className="text-muted max-w-2xl">
                Stay updated with upcoming sessions, explore free community content, and manage your purchased items.
              </p>
            </div>

            {/* Navigation Tabs - Professional Styling */}
            <div className="flex items-center gap-4 border-b border-stroke/30 overflow-x-auto scrollbar-hide">
              {[
                { id: 'upcoming', label: 'Upcoming Sessions', icon: '🔴', count: upcomingSessionsQuery.data?.items?.length || 0 },
                { id: 'free-content', label: 'Free Community', icon: '🎁', count: freeContentQuery.data?.items?.length || 0 },
                { id: 'library', label: 'My Library', icon: '📚', count: savedVideosQuery.data?.items?.length || 0 },
                { id: 'purchased', label: 'Purchased', icon: '🏆', count: purchasedContentQuery.data?.items?.length || 0 },
                { id: 'watchlist', label: 'Watchlist', icon: '⭐', count: watchlistQuery.data?.items?.length || 0 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-accent text-text'
                      : 'border-transparent text-muted hover:text-text'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    activeTab === tab.id ? 'bg-accent/20' : 'bg-surface-muted'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
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
        title="No upcoming sessions at the moment"
        body="Browse our catalog to discover amazing creators and upcoming live sessions"
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sessions.map((session: any) => (
        <Link key={session.id} to={`/lives/${session.id}`}>
          <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
            <div className="aspect-video bg-gradient-to-br from-accent/30 to-accent/10 relative overflow-hidden flex items-center justify-center group-hover:from-accent/40 transition">
              <span className="text-4xl opacity-70 group-hover:opacity-100 transition">🔴</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <h3 className="line-clamp-2 font-semibold text-text group-hover:text-accent transition">{session.title}</h3>
                <p className="text-sm text-muted">{session.creatorName}</p>
              </div>
              
              <p className="text-sm leading-5 text-muted line-clamp-2">{session.description}</p>
              
              <div className="flex items-center justify-between pt-2 border-t border-stroke/30">
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>📅 {new Date(session.startTime).toLocaleDateString()}</span>
                </div>
                {session.price > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-accent/20 text-sm font-semibold text-accent">
                    ${session.price}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Link>
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
        body="Check back soon for amazing free community content from your favorite creators"
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {content.map((item: any) => (
        <Card key={item.id} className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
          <div className="aspect-video bg-gradient-to-br from-success/20 to-success/5 relative overflow-hidden flex items-center justify-center group-hover:from-success/30 transition">
            <span className="text-4xl opacity-60 group-hover:opacity-100 transition">▶</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <h3 className="line-clamp-2 font-semibold text-text group-hover:text-success transition">{item.title}</h3>
              <p className="text-sm text-muted">{item.creator.name}</p>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted pt-2 border-t border-stroke/30">
              <div className="flex items-center gap-2">
                <span>👁</span>
                <span>{item.views} views</span>
              </div>
              <div className="flex items-center gap-2">
                <span>❤</span>
                <span>{item.likes}</span>
              </div>
            </div>
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
        body="Save videos and sessions to quickly access them later"
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video: any) => (
        <Card key={video.id} className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
          <div className="aspect-video bg-gradient-to-br from-warning/20 to-warning/5 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/20 transition">
              <span className="text-3xl opacity-60 group-hover:opacity-100">${Math.floor(video.savedProgress)}%</span>
            </div>
            <div className="absolute right-2 top-2 rounded-lg bg-accent/90 px-3 py-1">
              <p className="text-xs font-semibold text-white">
                {Math.floor(video.savedProgress)}% watched
              </p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <h3 className="line-clamp-2 font-semibold text-text">{video.title}</h3>
            <div className="space-y-2">
              <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all"
                  style={{ width: Math.min(video.savedProgress || 0, 100) + '%' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm">
                  Continue
                </Button>
                <span className="text-xs text-muted">
                  {Math.floor(video.savedProgress)}% done
                </span>
              </div>
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
        body="Explore premium content from creators and build your knowledge library"
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {content.map((item: any) => (
        <Card key={item.id} className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
          <div className="aspect-video bg-gradient-to-br from-accent/20 to-accent/5 relative overflow-hidden flex items-center justify-center group-hover:from-accent/30 transition">
            <span className="text-4xl opacity-60 group-hover:opacity-100 transition">🏆</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <h3 className="line-clamp-2 font-semibold text-text group-hover:text-accent transition">{item.title}</h3>
              <p className="text-sm text-muted">{item.creator.name}</p>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-stroke/30">
              <span className="text-success">✓ Purchased</span>
              <span className="text-muted">{new Date(item.purchaseDate).toLocaleDateString()}</span>
            </div>
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
        body="Add sessions and content to your watchlist to stay organized"
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <Card key={item.id} className="flex items-center justify-between gap-4 p-5 transition-all duration-300 hover:shadow-md group">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⭐</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text line-clamp-1">{item.title}</h3>
              <p className="text-xs text-muted">{item.creator.name}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" className="text-xs">
              View
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-danger hover:text-danger">
              Remove
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

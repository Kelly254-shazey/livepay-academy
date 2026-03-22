import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
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
  StatCard,
} from '@/components/ui';

interface LiveSession {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'scheduled' | 'live' | 'ended';
  startTime: string;
  endTime?: string;
  price: number;
  type: 'audio' | 'video' | 'both';
  participantCount: number;
  viewers: number;
  creatorId: string;
}

interface FreeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  uploadedAt: string;
}

export function CreatorDashboardPage() {
  const session = useSessionStore((state) => state.session);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleBack = () => {
    navigate('/dashboard/user');
  };

  const sessionsQuery = useQuery({
    queryKey: ['creator-sessions', session?.user.id],
    queryFn: async () => ({ items: [] }),
    enabled: Boolean(session),
  });

  const freeVideosQuery = useQuery({
    queryKey: ['creator-free-videos', session?.user.id],
    queryFn: async () => ({ items: [] }),
    enabled: Boolean(session),
  });

  const earningsQuery = useQuery({
    queryKey: ['creator-earnings', session?.user.id],
    queryFn: async () => ({ total: 0, monthly: 0, pending: 0 }),
    enabled: Boolean(session),
  });

  const statsQuery = useQuery({
    queryKey: ['creator-stats', session?.user.id],
    queryFn: async () => ({ views: 0, followers: 0, engagement: 0 }),
    enabled: Boolean(session),
  });

  return (
    <PageFrame>
      <AppShell sidebarTitle="Creator Studio" sidebarItems={[]}>
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🎬</span>
                <h1 className="text-3xl font-bold text-text">Creator Studio</h1>
              </div>
              <p className="text-muted">Manage your content, sessions, and monetization</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 rounded-lg border border-stroke/30 bg-surface/50 px-3 py-2 font-medium text-muted transition-all hover:bg-surface hover:text-text"
              >
                ← Back
              </button>
              <Link to="/creator/sessions/new">
                <Button size="lg">+ Create Session</Button>
              </Link>
            </div>
          </div>

          {/* Creator Status Card */}
          <Card className="border-l-4 border-accent/30 bg-gradient-to-r from-accent/5 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text">Creator Status</p>
                <p className="mt-1 text-xs text-muted">You're verified and eligible to host paid sessions</p>
              </div>
              <Badge tone="success">Verified Creator</Badge>
            </div>
          </Card>

          {/* Tabs */}
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-stroke/30 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'sessions'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                Live Sessions ({sessionsQuery.data?.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('free-videos')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'free-videos'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                Free Videos ({freeVideosQuery.data?.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-text'
                }`}
              >
                Analytics
              </button>
            </div>

            {activeTab === 'overview' && (
              <OverviewSection stats={statsQuery.data} earnings={earningsQuery.data} />
            )}
            {activeTab === 'sessions' && (
              <SessionsSection
                sessions={sessionsQuery.data?.items}
                isLoading={sessionsQuery.isLoading}
              />
            )}
            {activeTab === 'free-videos' && (
              <FreeVideosSection
                videos={freeVideosQuery.data?.items}
                isLoading={freeVideosQuery.isLoading}
              />
            )}
            {activeTab === 'analytics' && <AnalyticsSection />}
          </div>
        </div>
      </AppShell>
    </PageFrame>
  );
}

function OverviewSection({ stats, earnings }: any) {
  if (!stats || !earnings) {
    return <LoadingBlock lines={8} />;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="space-y-2 p-6">
          <p className="text-sm text-muted">Total Revenue</p>
          <p className="text-2xl font-bold text-text">${earnings.total.toFixed(2)}</p>
          <p className="text-xs text-success">+{earnings.monthlyGrowth}% this month</p>
        </Card>
        <Card className="space-y-2 p-6">
          <p className="text-sm text-muted">Active Sessions</p>
          <p className="text-2xl font-bold text-text">{stats.activeSessions}</p>
          <p className="text-xs text-muted">{stats.upcomingSessions} upcoming</p>
        </Card>
        <Card className="space-y-2 p-6">
          <p className="text-sm text-muted">Total Participants</p>
          <p className="text-2xl font-bold text-text">{stats.totalParticipants}</p>
          <p className="text-xs text-muted">Across all sessions</p>
        </Card>
        <Card className="space-y-2 p-6">
          <p className="text-sm text-muted">Avg Rating</p>
          <p className="text-2xl font-bold text-text">
            {stats.averageRating.toFixed(1)} ★
          </p>
          <p className="text-xs text-muted">{stats.ratingCount} reviews</p>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="space-y-4 p-6">
        <h3 className="text-lg font-semibold text-text">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between border-b border-stroke/30 pb-3">
              <div>
                <p className="font-medium text-text">Session #{i}</p>
                <p className="text-sm text-muted">2 hours ago - 45 participants</p>
              </div>
              <Badge>Completed</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SessionsSection({ sessions, isLoading }: any) {
  if (isLoading) return <LoadingBlock lines={6} />;

  if (!sessions?.length) {
    return (
      <EmptyState
        title="No live sessions yet"
        body="Create your first paid live session to start earning"
      />
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session: LiveSession) => (
        <Card
          key={session.id}
          className="flex items-start justify-between gap-4 p-6 transition hover:shadow-panel"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-text">{session.title}</h3>
              <Badge
                tone={
                  session.status === 'live'
                    ? 'success'
                    : session.status === 'scheduled'
                      ? 'accent'
                      : 'default'
                }
              >
                {session.status}
              </Badge>
            </div>
            <p className="text-sm text-muted">{session.description}</p>
            <div className="flex flex-wrap gap-4 pt-2 text-sm">
              <span className="text-muted">
                Type: <span className="text-text capitalize">{session.type}</span>
              </span>
              <span className="text-muted">
                Price: <span className="text-text font-medium">${session.price}</span>
              </span>
              <span className="text-muted">
                Participants: <span className="text-text">{session.participantCount}</span>
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/creator/sessions/${session.id}`}>
              <Button variant="secondary" size="sm">
                Manage
              </Button>
            </Link>
            {session.status === 'live' && (
              <Link to={`/lives/${session.id}/room`}>
                <Button size="sm">Join</Button>
              </Link>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function FreeVideosSection({ videos, isLoading }: any) {
  if (isLoading) return <LoadingBlock lines={6} />;

  if (!videos?.length) {
    return (
      <EmptyState
        title="No free videos yet"
        body="Upload free content to attract viewers and build your audience"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video: FreeVideo) => (
        <Card key={video.id} className="overflow-hidden transition hover:shadow-panel">
          <div className="aspect-video bg-surface-muted" />
          <div className="space-y-3 p-4">
            <h3 className="line-clamp-2 font-semibold text-text">{video.title}</h3>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>{video.views} views</span>
              <span>{Math.floor(video.duration / 60)}m</span>
            </div>
            <Button variant="ghost" className="w-full" size="sm">
              Manage
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <h3 className="text-lg font-semibold text-text">Session Performance</h3>
        <div className="h-64 rounded-lg bg-surface-muted flex items-center justify-center text-muted">
          Chart placeholder - Revenue over time
        </div>
      </Card>
      <Card className="space-y-4 p-6">
        <h3 className="text-lg font-semibold text-text">Audience Insights</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-surface-muted p-4">
            <p className="text-sm text-muted">Top performing session</p>
            <p className="mt-2 text-xl font-bold text-text">Advanced Trading Q&A</p>
            <p className="text-sm text-muted">892 participants • $2,240 revenue</p>
          </div>
          <div className="rounded-lg bg-surface-muted p-4">
            <p className="text-sm text-muted">Avg completion rate</p>
            <p className="mt-2 text-xl font-bold text-text">87%</p>
            <p className="text-sm text-muted">+5% from last month</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

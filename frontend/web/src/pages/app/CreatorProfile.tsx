import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AppShell, PageFrame } from '@/components/layout';
import { webApi } from '@/lib/api';
import {
  Button,
  Card,
  Badge,
  Tabs,
  LoadingBlock,
  EmptyState,
} from '@/components/ui';

export function CreatorProfilePage() {
  const { creatorId } = useParams();

  const creatorQuery = useQuery({
    queryKey: ['creator', creatorId],
    queryFn: () => webApi.getCreatorProfile(creatorId!),
  });

  const sessionsQuery = useQuery({
    queryKey: ['creator-sessions', creatorId],
    queryFn: async () => ({ items: [] }),
    enabled: !!creatorId,
  });

  const reviewsQuery = useQuery({
    queryKey: ['creator-reviews', creatorId],
    queryFn: async () => ({ items: [] }),
    enabled: !!creatorId,
  });

  if (creatorQuery.isLoading) return <LoadingBlock />;
  if (creatorQuery.isError || !creatorQuery.data) {
    return (
      <PageFrame>
        <div className="text-center py-12">
          <p className="text-danger">Creator profile not found</p>
        </div>
      </PageFrame>
    );
  }

  const creator = creatorQuery.data;

  return (
    <PageFrame>
      <AppShell sidebarTitle="Creator" sidebarItems={[]}>
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative h-64 bg-gradient-to-r from-accent/20 to-accent/5 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black/30" />

            {/* Profile Card Overlay */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end p-6 gap-6 translate-y-1/2">
              <div className="w-32 h-32 rounded-2xl border-4 border-background bg-accent/20 flex items-center justify-center text-4xl">
                👤
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bold text-white">{(creator as any).name || 'Creator'}</h1>
                <p className="text-white/80">{(creator as any).headline || 'Professional creator'}</p>
              </div>
            </div>
          </div>

          {/* Spacer for overlay */}
          <div className="h-12" />

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">0</p>
              <p className="text-sm text-muted mt-1">Followers</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">4.8</p>
              <p className="text-sm text-muted mt-1">Rating</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">12</p>
              <p className="text-sm text-muted mt-1">Sessions</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">98%</p>
              <p className="text-sm text-muted mt-1">Response</p>
            </Card>
          </div>

          {/* Bio & Details */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text">About</h2>
              <p className="mt-2 text-text">{(creator as any).bio || 'Experienced professional creator'}</p>
            </div>

            <div className="border-t border-stroke/30 pt-6">
              <h2 className="text-lg font-semibold text-text mb-3">Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {['Education', 'Business', 'Trading'].map((category) => (
                  <Badge key={category} tone="default">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {(creator as any).socialLinks && (
              <div className="border-t border-stroke/30 pt-6">
                <h2 className="text-lg font-semibold text-text mb-3">Connect</h2>
                <div className="flex gap-3">
                  {(creator as any).socialLinks.twitter && (
                    <a href={`https://twitter.com/${(creator as any).socialLinks.twitter}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 transition-colors">
                      Twitter
                    </a>
                  )}
                  {(creator as any).socialLinks.instagram && (
                    <a href={`https://instagram.com/${(creator as any).socialLinks.instagram}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 transition-colors">
                      Instagram
                    </a>
                  )}
                  {(creator as any).socialLinks.linkedin && (
                    <a href={(creator as any).socialLinks.linkedin}
                      target="_blank" rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 transition-colors">
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-stroke/30 pt-6 flex gap-3">
              <Button className="flex-1">Follow Creator</Button>
              <Button variant="secondary" className="flex-1">Message</Button>
            </div>
          </Card>

          {/* Tabs */}
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-stroke/30">
              <button className="px-4 py-2 text-accent border-b-2 border-accent font-medium">Live Sessions</button>
              <button className="px-4 py-2 text-muted hover:text-text transition-colors">Reviews</button>
              <button className="px-4 py-2 text-muted hover:text-text transition-colors">About</button>
            </div>
            <SessionsTab sessions={sessionsQuery.data} isLoading={sessionsQuery.isLoading} />
          </div>
        </div>
      </AppShell>
    </PageFrame>
  );
}

function SessionsTab({ sessions, isLoading }: any) {
  if (isLoading) return <LoadingBlock />;
  if (!sessions?.items?.length) return <EmptyState title="No sessions" body="This creator hasn't scheduled any sessions yet" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(sessions.items || []).map((session: any) => (
        <Card key={session.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="aspect-video bg-accent/10 rounded-lg mb-4 flex items-center justify-center text-4xl">
            🎥
          </div>
          <h3 className="font-semibold text-text">{session.title}</h3>
          <p className="text-sm text-muted mt-1">{(session.description || '').substring(0, 80)}...</p>
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-accent">${session.price}</span>
            <Badge tone={session.status === 'live' ? 'success' : 'default'}>
              {session.status}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ReviewsTab({ reviews, isLoading }: any) {
  if (isLoading) return <LoadingBlock />;
  if (!reviews?.items?.length) return <EmptyState title="No reviews yet" body="Be the first to review this creator" />;

  return (
    <div className="space-y-4">
      {(reviews.items || []).map((review: any) => (
        <Card key={review.id} className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-text">{review.reviewerName}</p>
              <p className="text-sm text-muted">{review.date}</p>
            </div>
            <div className="text-lg">
              {'⭐'.repeat(review.rating)}
            </div>
          </div>
          <p className="text-text">{review.comment}</p>
        </Card>
      ))}
    </div>
  );
}

function AboutTab({ creator }: any) {
  const availability = [
    { day: 'Monday', time: '2:00 PM - 5:00 PM' },
    { day: 'Wednesday', time: '3:00 PM - 6:00 PM' },
    { day: 'Friday', time: '1:00 PM - 4:00 PM' },
    { day: 'Sunday', time: '4:00 PM - 7:00 PM' },
  ];

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-text mb-2">Teaching Style</h3>
        <p className="text-text">{(creator as any).teachingStyle || 'Interactive and personalized sessions tailored to student level and goals.'}</p>
      </div>

      <div className="border-t border-stroke/30 pt-6">
        <h3 className="font-semibold text-text mb-2">Experience</h3>
        <p className="text-text">{(creator as any).experience || '10+ years of professional experience in the field with multiple certifications.'}</p>
      </div>

      <div className="border-t border-stroke/30 pt-6">
        <h3 className="font-semibold text-text mb-2">Session Availability</h3>
        <div className="grid grid-cols-2 gap-4">
          {availability.map((slot) => (
            <div key={slot.day} className="p-3 bg-accent/5 rounded-lg">
              <p className="font-medium text-text">{slot.day}</p>
              <p className="text-sm text-muted">{slot.time}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
